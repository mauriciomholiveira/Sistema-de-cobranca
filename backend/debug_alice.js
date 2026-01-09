
const db = require('./src/database/db');

async function debugAlice() {
    try {
        console.log("--- DEBUG ALICE ---");
        const res = await db.query(`
            SELECT 
                c.id as client_id,
                c.nome,
                m.id as mat_id,
                m.valor_mensalidade as valor_matricula,
                p.id as pay_id,
                p.valor_cobrado as valor_pagamento,
                p.status
            FROM clientes c
            LEFT JOIN matriculas m ON c.id = m.cliente_id
            LEFT JOIN pagamentos p ON m.id = p.matricula_id AND p.mes_ref = '2026-01'
            WHERE c.nome ILIKE '%Alice%'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

debugAlice();
