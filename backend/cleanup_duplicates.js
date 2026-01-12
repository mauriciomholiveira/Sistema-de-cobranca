
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
        console.log('Checking for duplicate enrollments...');
        
        // Find clients who have multiple ACTIVE matriculas for the SAME course
        const duplicatas = await pool.query(`
            SELECT cliente_id, curso_id, COUNT(*) 
            FROM matriculas 
            WHERE active = TRUE 
            GROUP BY cliente_id, curso_id 
            HAVING COUNT(*) > 1
        `);
        
        console.log(`Found ${duplicatas.rows.length} duplicate enrollment sets.`);

        for (const row of duplicatas.rows) {
            console.log(`Processing dupe for Client ${row.cliente_id}, Course ${row.curso_id}...`);
            
            // Get all active matriculas, newest first
            const mats = await pool.query(`
                SELECT id FROM matriculas 
                WHERE active = TRUE AND cliente_id = $1 AND curso_id = $2 
                ORDER BY id DESC
            `, [row.cliente_id, row.curso_id]);
            
            if (mats.rows.length > 1) {
                // Keep the newest (index 0)
                const keepId = mats.rows[0].id;
                // Deactivate the rest
                const removeIds = mats.rows.slice(1).map(r => r.id);
                
                console.log(`Keeping Matricula ${keepId}, deactivating: ${removeIds.join(', ')}`);
                
                for (const remId of removeIds) {
                    // 1. Deactivate matricula
                    await pool.query('UPDATE matriculas SET active = FALSE WHERE id = $1', [remId]);
                    
                    // 2. Delete PENDING payments for the deactivated matricula
                    const delRes = await pool.query(`
                        DELETE FROM pagamentos 
                        WHERE matricula_id = $1 AND status = 'PENDENTE'
                    `, [remId]);
                    console.log(`Deleted ${delRes.rowCount} pending payments for old Matricula ${remId}`);
                }
            }
        }
        
        // Extra check: Duplicate PAYMENTS for the SAME matricula/month
        console.log('Checking for duplicate PAYMENTS on valid matriculas...');
        const dupePayments = await pool.query(`
            SELECT matricula_id, mes_ref, COUNT(*)
            FROM pagamentos
            GROUP BY matricula_id, mes_ref
            HAVING COUNT(*) > 1
        `);
        
        console.log(`Found ${dupePayments.rows.length} duplicate payment sets.`);
        
        for (const row of dupePayments.rows) {
             console.log(`Fixing duplicate payments for Matricula ${row.matricula_id}, Month ${row.mes_ref}`);
             
             // Keep the one that is PAID if any, otherwise keep the newest
             const pays = await pool.query(`
                SELECT id, status FROM pagamentos
                WHERE matricula_id = $1 AND mes_ref = $2
                ORDER BY CASE WHEN status = 'PAGO' THEN 0 ELSE 1 END, id DESC
             `, [row.matricula_id, row.mes_ref]);
             
             const keepPayId = pays.rows[0].id;
             const removePayIds = pays.rows.slice(1).map(r => r.id);
             
             for (const pid of removePayIds) {
                 await pool.query('DELETE FROM pagamentos WHERE id = $1', [pid]);
             }
             console.log(`Removed ${removePayIds.length} duplicate payments.`);
        }

        console.log('Cleanup finished.');
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        pool.end();
    }
})();
