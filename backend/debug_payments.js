
const db = require('./src/database/db');

async function debugPayments() {
    try {
        console.log("--- DEBUG PAYMENTS JAN 2026 ---");
        const res = await db.query(`
            SELECT 
                p.id, 
                c.nome as cliente, 
                p.status, 
                p.valor_cobrado,
                p.mes_ref,
                m.professor_id as mat_prof_id,
                p.professor_id as pay_prof_id,
                prof_mat.nome as nome_prof_matricula
            FROM pagamentos p
            JOIN matriculas m ON p.matricula_id = m.id
            JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN professores prof_mat ON m.professor_id = prof_mat.id
            WHERE p.mes_ref = '2026-01'
            ORDER BY c.nome ASC
        `);

        console.table(res.rows.map(r => ({
            id: r.id,
            cliente: r.cliente,
            status: r.status,
            valor: r.valor_cobrado,
            mes: r.mes_ref,
            mat_prof: r.nome_prof_matricula,
            mat_prof_id: r.mat_prof_id
        })));

        console.log("--- ACTIVE MATRICULAS WITHOUT PAYMENTS ---");
        const missing = await db.query(`
            SELECT c.nome, m.id as mat_id, prof.nome as professor
            FROM matriculas m
            JOIN clientes c ON m.cliente_id = c.id
            JOIN professores prof ON m.professor_id = prof.id
            WHERE m.active = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM pagamentos p 
                WHERE p.matricula_id = m.id AND p.mes_ref = '2026-01'
            )
        `);
        console.table(missing.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(); // Force exit
    }
}

debugPayments();
