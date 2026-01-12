
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
    try {
        console.log('Starting redundant payment cleanup...');

        // 1. Find PAGO payments on INACTIVE matriculas where an ACTIVE matricula exists for same client/course
        const moveCandidates = await pool.query(`
            SELECT 
                p.id as payment_id,
                p.matricula_id as old_mat_id,
                m_old.cliente_id,
                m_old.curso_id,
                p.mes_ref,
                m_new.id as new_mat_id
            FROM pagamentos p
            JOIN matriculas m_old ON p.matricula_id = m_old.id
            JOIN matriculas m_new ON m_old.cliente_id = m_new.cliente_id AND m_old.curso_id = m_new.curso_id
            WHERE p.status = 'PAGO'
            AND m_old.active = FALSE
            AND m_new.active = TRUE
        `);
        
        console.log(`Found ${moveCandidates.rows.length} PAID payments to migrate to active matriculas.`);

        for (const row of moveCandidates.rows) {
            console.log(`Moving Payment ${row.payment_id} from Matricula ${row.old_mat_id} to ${row.new_mat_id}`);
            
            // 1. Check for conflict in destination
            const conf = await pool.query(`
                SELECT id FROM pagamentos 
                WHERE matricula_id = $1 AND mes_ref = $2
            `, [row.new_mat_id, row.mes_ref]);
            
            if (conf.rows.length > 0) {
                 const confId = conf.rows[0].id;
                 console.log(`Conflict in destination: Payment ${confId}. Deleting it to make room.`);
                 await pool.query('DELETE FROM pagamentos WHERE id = $1', [confId]);
            }
            
            // 2. Update matricula_id
            await pool.query('UPDATE pagamentos SET matricula_id = $1 WHERE id = $2', [row.new_mat_id, row.payment_id]);
        }

        // 2. Fallback: Find any pairs of payments for same Client/Course/Month where one is PAGO and one is PENDING
        // regardless of matricula association, and delete the PENDING one.
        console.log('Checking for Cross-Matricula conflicts (Paid vs Pending)...');
        
        const conflicts = await pool.query(`
            SELECT 
                p1.id as paid_id, p1.matricula_id as paid_mat_id,
                p2.id as pending_id, p2.matricula_id as pending_mat_id,
                c.nome as cliente_nome
            FROM pagamentos p1
            JOIN pagamentos p2 ON p1.cliente_id = p2.cliente_id 
                AND p1.curso_id = p2.curso_id 
                AND p1.mes_ref = p2.mes_ref
            JOIN clientes c ON p1.cliente_id = c.id
            WHERE p1.status = 'PAGO' 
            AND p2.status != 'PAGO'
            AND p1.id != p2.id
        `);
        
        console.log(`Found ${conflicts.rows.length} conflicts.`);
        
        for (const row of conflicts.rows) {
             console.log(`Resolving conflict for ${row.cliente_nome}: Keeping Paid ${row.paid_id}, Deleting Pending ${row.pending_id}`);
             await pool.query('DELETE FROM pagamentos WHERE id = $1', [row.pending_id]);
        }

        console.log('Redundant cleanup finished.');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
