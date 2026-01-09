
const db = require('./src/database/db');

async function fixPaymentMismatches() {
    try {
        console.log("--- FIXING PAYMENT MISMATCHES (PENDING ONLY) ---");
        
        // Find Pending payments where value differs from current tuition
        const mismatches = await db.query(`
            SELECT 
                p.id, 
                c.nome, 
                p.valor_cobrado, 
                m.valor_mensalidade,
                m.valor_professor,
                m.valor_igreja
            FROM pagamentos p
            JOIN matriculas m ON p.matricula_id = m.id
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.mes_ref = '2026-01'
            AND p.status = 'PENDENTE'
            AND p.valor_cobrado != m.valor_mensalidade
        `);

        console.log(`Found ${mismatches.rowCount} pending payments with mismatched values.`);

        for (const row of mismatches.rows) {
            console.log(`Fixing ${row.nome}: ${row.valor_cobrado} -> ${row.valor_mensalidade}`);
            
            await db.query(`
                UPDATE pagamentos
                SET 
                    valor_cobrado = $1,
                    valor_professor_recebido = $2,
                    valor_igreja_recebido = $3
                WHERE id = $4
            `, [
                row.valor_mensalidade, 
                row.valor_professor || 0,
                row.valor_igreja || 0,
                row.id
            ]);
        }
        
        // Check Calleb
        const calleb = await db.query("SELECT id, active FROM matriculas WHERE professor_id = 1 AND active = TRUE AND cliente_id = (SELECT id FROM clientes WHERE nome = 'CALLEB')");
        if (calleb.rowCount > 0) {
            console.log("CALLEB has active matricula but no payment. Leaving as is (or should we generate?).");
            // User implies he is inactive.
        }

        console.log("--- DONE ---");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixPaymentMismatches();
