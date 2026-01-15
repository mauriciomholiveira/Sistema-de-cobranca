const { Pool } = require('pg');

const pool = new Pool({
    user: 'cobranca_user',
    host: 'postgres',
    database: 'cobranca_db',
    password: 'cobranca_pass',
    port: 5432,
});

const rawData = [
    { nome: 'ALICE', val: 55, status: 'PAGO' },
    { nome: 'AMINAH', val: 55, status: 'PAGO' },
    { nome: 'CALLEB', val: 0, status: 'ISENTO' },
    { nome: 'DANILO', val: 0, status: 'ISENTO' },
    { nome: 'DAVI', val: 0, status: 'ISENTO' },
    { nome: 'DAVID', val: 110, status: 'PAGO' },
    { nome: 'HENRY', val: 0, status: 'ISENTO' },
    { nome: 'ISABELA', val: 55, status: 'PAGO' }, // Assumed PAGO based on context
    { nome: 'KLEBER', val: 55, status: 'PAGO' },
    { nome: 'Claudete', val: 150, status: 'PAGO' },
    { nome: 'Claudinéia', val: 150, status: 'PAGO' },
    { nome: 'DANIELA', val: 150, status: 'PAGO' }, // Canto
    { nome: 'Kaira', val: 0, status: 'ISENTO' },
    { nome: 'NICOLAS', val: 150, status: 'PAGO' },
    { nome: 'Tayna', val: 150, status: 'PAGO' },
    { nome: 'ADRIAN', val: 110, status: 'PAGO' },
    { nome: 'CARLOS', val: 110, status: 'PAGO' },
    { nome: 'DANIELA', val: 110, status: 'PAGO' }, // Instrumento 1
    { nome: 'DANIELA', val: 110, status: 'PAGO' }, // Instrumento 2
    { nome: 'HENRI', val: 0, status: 'ISENTO' },
    { nome: 'HENRIQUE', val: 110, status: 'PAGO' },
    { nome: 'ISMAEL', val: 110, status: 'PAGO' },
    { nome: 'LAVINIA', val: 130, status: 'PAGO' },
    { nome: 'MATHEUS', val: 110, status: 'PAGO' },
    { nome: 'NATHAN', val: 110, status: 'PAGO' }
];

function getSplit(value) {
    if (value === 150) return { prof: 135, church: 15 };
    if (value === 55) return { prof: 50, church: 5 };
    if (value === 110) return { prof: 100, church: 10 };
    if (value === 130) return { prof: 100, church: 30 };
    if (value === 0) return { prof: 0, church: 0 };
    
    // Fallback logic if needed (e.g. 10% church) - but for now strictly follows specs or keeps 0 church
    return { prof: value, church: 0 };
}

async function importPayments() {
    try {
        console.log('Iniciando importação de pagamentos JAN/2026...');
        const mesRef = '2026-01';

        for (const item of rawData) {
            // 1. Find Client
            const clientRes = await pool.query('SELECT id FROM clientes WHERE nome = $1', [item.nome]);
            if (clientRes.rows.length === 0) {
                console.error(`Cliente não encontrado: ${item.nome}`);
                continue;
            }
            const clientId = clientRes.rows[0].id; // Assumption: name is unique enough or we take first

            // 2. Get active matriculas
            const matRes = await pool.query('SELECT * FROM matriculas WHERE cliente_id = $1 AND active = TRUE', [clientId]);
            let matriculas = matRes.rows;

            if (matriculas.length === 0) {
                console.error(`Nenhuma matrícula para: ${item.nome}`);
                continue;
            }

            // 3. Match Matricula and Update/Insert
            // Heuristic: If multiple matriculas, try to find one matching the value (for disambiguation)
            // Or prioritize one that matches the payment ID if available, but here we don't have IDs.
            // We'll iterate matriculas and find/create payment for the "best" one.
            
            let targetMatricula = null;
            let existingPayment = null;

            // Fetch existing payments for all candidate matriculas
            for (const m of matriculas) {
                const res = await pool.query('SELECT * FROM pagamentos WHERE matricula_id = $1 AND mes_ref = $2', [m.id, mesRef]);
                if (res.rows.length > 0) {
                     // Found an existing payment logic
                     const pay = res.rows[0];
                     // Heuristic: If we have value ambiguity (Daniela), check if this payment matches the target value?
                     // Or check course?
                     // If item.val > 0, we prefer a matricula/payment that matches that value standard?
                     
                     // Simple approach: prefer 'PENDENTE' ones to upgrade them.
                     if (pay.status === 'PENDENTE') {
                         targetMatricula = m;
                         existingPayment = pay;
                         
                         // If we have strict value matching needs (Daniela 150 vs 110), check:
                         // But Daniela 150 is Canto, 110 is Instrumento.
                         // So checking if m.valor_mensalidade matches item.val is good.
                         if (Math.abs(parseFloat(m.valor_mensalidade) - item.val) < 1.0) {
                             break; // Perfect match found
                         }
                     }
                }
            }

            // If no pending payment found to upgrade, maybe try to match matricula by value to insert new?
            if (!targetMatricula) {
                 if (matriculas.length === 1) {
                     targetMatricula = matriculas[0];
                 } else {
                     targetMatricula = matriculas.find(m => Math.abs(parseFloat(m.valor_mensalidade) - item.val) < 1.0);
                     if (!targetMatricula) targetMatricula = matriculas[0];
                 }
                 // Check if it has a payment (maybe already paid?)
                 const res = await pool.query('SELECT * FROM pagamentos WHERE matricula_id = $1 AND mes_ref = $2', [targetMatricula.id, mesRef]);
                 if (res.rows.length > 0) existingPayment = res.rows[0];
            }

            const { prof, church } = getSplit(item.val);
            const dataVencimento = `${mesRef}-10`;

            if (existingPayment) {
                 // UPDATE
                 await pool.query(`
                    UPDATE pagamentos SET
                        valor_cobrado = $1,
                        status = $2,
                        data_pagamento = $3,
                        valor_professor_recebido = $4,
                        valor_igreja_recebido = $5
                    WHERE id = $6
                 `, [
                    item.val,
                    item.status,
                    item.status === 'PAGO' ? new Date() : null,
                    prof,
                    church,
                    existingPayment.id
                 ]);
                 console.log(`Pagamento ATUALIZADO: ${item.nome} -> R$ ${item.val} (${item.status}) [ID: ${existingPayment.id}]`);
            } else {
                 // INSERT
                 await pool.query(`
                    INSERT INTO pagamentos (
                        matricula_id, cliente_id, professor_id, curso_id,
                        mes_ref, valor_cobrado, data_vencimento, status, data_pagamento,
                        valor_professor_recebido, valor_igreja_recebido
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    targetMatricula.id,
                    targetMatricula.cliente_id,
                    targetMatricula.professor_id,
                    targetMatricula.curso_id,
                    mesRef,
                    item.val,
                    dataVencimento,
                    item.status,
                    item.status === 'PAGO' ? new Date() : null,
                    prof,
                    church
                ]);
                console.log(`Pagamento INSERIDO: ${item.nome} -> R$ ${item.val} (${item.status})`);
            }
        }
        
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

importPayments();
