const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    user: 'cobranca_user',
    host: 'localhost',
    database: 'cobranca_db',
    password: 'cobranca_pass',
    port: 5432,
});

const backupFile = path.join(__dirname, '../backup_cobranca_data_2026-01-10T13-11-51-929Z.json');

async function restore() {
    const client = await pool.connect();
    try {
        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

        console.log('🔄 Cleaning tables...');
        // Order matters for FKs
        await client.query('TRUNCATE pagamentos, matriculas, clientes, cursos, professores RESTART IDENTITY CASCADE');

        console.log('🔄 Restoring Professores...');
        for (const p of data.professores || []) {
            await client.query(
                `INSERT INTO professores (id, nome, active, pix, cpf, contato, endereco, dados_bancarios, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [p.id, p.nome, p.active, p.pix, p.cpf, p.contato, p.endereco, p.dados_bancarios, p.created_at]
            );
        }

        console.log('🔄 Restoring Cursos...');
        for (const c of data.cursos || []) {
            await client.query(
                `INSERT INTO cursos (id, nome, mensalidade_padrao, active, created_at) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [c.id, c.nome, c.mensalidade_padrao, c.active, c.created_at]
            );
        }

        console.log('🔄 Restoring Clientes...');
        for (const cli of data.clientes || []) {
            await client.query(
                `INSERT INTO clientes (id, nome, endereco, whatsapp, dia_vencimento, valor_padrao, professor_id, curso_id, active, valor_professor, valor_igreja, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [cli.id, cli.nome, cli.endereco, cli.whatsapp, cli.dia_vencimento, cli.valor_padrao, cli.professor_id, cli.curso_id, cli.active, cli.valor_professor, cli.valor_igreja, cli.created_at]
            );
        }

        console.log('🔄 Restoring Matriculas...');
        for (const m of data.matriculas || []) {
             await client.query(
                `INSERT INTO matriculas (id, cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [m.id, m.cliente_id, m.curso_id, m.professor_id, m.dia_vencimento, m.valor_mensalidade, m.valor_professor, m.valor_igreja, m.active, m.created_at]
            );
        }

        console.log('🔄 Restoring Pagamentos...');
        for (const pg of data.pagamentos || []) {
            await client.query(
                `INSERT INTO pagamentos (id, matricula_id, cliente_id, professor_id, curso_id, mes_ref, valor_cobrado, data_vencimento, status, data_pagamento, valor_professor_recebido, valor_igreja_recebido, msg_lembrete_enviada, msg_vencimento_enviada, msg_atraso_enviada, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [pg.id, pg.matricula_id, pg.cliente_id, pg.professor_id, pg.curso_id, pg.mes_ref, pg.valor_cobrado, pg.data_vencimento, pg.status, pg.data_pagamento, pg.valor_professor_recebido, pg.valor_igreja_recebido, pg.msg_lembrete_enviada, pg.msg_vencimento_enviada, pg.msg_atraso_enviada, pg.created_at]
            );
        }

        // Reset sequences to update them to max ID found from backup
        console.log('🔄 Resetting sequences...');
        await client.query(`SELECT setval('professores_id_seq', (SELECT MAX(id) FROM professores));`);
        await client.query(`SELECT setval('cursos_id_seq', (SELECT MAX(id) FROM cursos));`);
        await client.query(`SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));`);
        await client.query(`SELECT setval('matriculas_id_seq', (SELECT MAX(id) FROM matriculas));`);
        await client.query(`SELECT setval('pagamentos_id_seq', (SELECT MAX(id) FROM pagamentos));`);

        // Restore Admin User
        console.log('➕ Re-creating Admin User...');
        // Now sequence is safe
        await client.query(`
            INSERT INTO professores (nome, email, senha, is_admin, active) 
            VALUES ('Admin Restaurado', 'admin@email.com', '123', TRUE, TRUE)
        `);

        console.log('✅ Restore completed successfully!');
    } catch (err) {
        console.error('❌ Restore failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

restore();
