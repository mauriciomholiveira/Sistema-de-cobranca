
const db = require('./src/database/db');

async function auditPayments() {
    try {
        console.log("--- AUDIT PAYMENTS JAN 2026 ---");
        const res = await db.query(`
            SELECT 
                c.nome,
                p.id as pay_id,
                p.valor_cobrado,
                m.valor_mensalidade,
                p.status
            FROM pagamentos p
            JOIN matriculas m ON p.matricula_id = m.id
            JOIN clientes c ON m.cliente_id = c.id
            WHERE p.mes_ref = '2026-01'
            ORDER BY c.nome ASC
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

auditPayments();
