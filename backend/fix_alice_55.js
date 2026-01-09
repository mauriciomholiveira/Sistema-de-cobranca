
const db = require('./src/database/db');

async function fixAlice() {
    try {
        console.log("--- UPDATING ALICE TO 55.00 ---");
        // Update Payment
        await db.query(`
            UPDATE pagamentos p
            SET valor_cobrado = 55.00
            FROM matriculas m
            JOIN clientes c ON m.cliente_id = c.id
            WHERE p.matricula_id = m.id
            AND c.nome ILIKE '%Alice%'
            AND p.mes_ref = '2026-01'
        `);
        
        // Verify
        const res = await db.query(`
             SELECT c.nome, p.valor_cobrado, p.mes_ref
             FROM clientes c
             JOIN matriculas m ON c.id = m.cliente_id
             JOIN pagamentos p ON m.id = p.matricula_id
             WHERE c.nome ILIKE '%Alice%' AND p.mes_ref = '2026-01'
        `);
        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixAlice();
