
const db = require('./src/database/db');

async function fixZeroPayments() {
    try {
        console.log("--- FIXING ZERO PAYMENTS ---");
        
        // Find mismatches
        const candidates = await db.query(`
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
            AND p.valor_cobrado = 0
            AND m.valor_mensalidade > 0
        `);

        console.log(`Found ${candidates.rowCount} payments with 0 value but active tuition.`);

        for (const row of candidates.rows) {
            console.log(`Fixing ${row.nome}: 0.00 -> ${row.valor_mensalidade}`);
            
            await db.query(`
                UPDATE pagamentos
                SET 
                    valor_cobrado = $1,
                    valor_professor_recebido = $2,
                    valor_igreja_recebido = $3
                WHERE id = $4
            `, [
                row.valor_mensalidade, 
                row.valor_professor || 0, // Fallback to tuition split
                row.valor_igreja || 0,
                row.id
            ]);
        }

        console.log("--- DONE ---");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixZeroPayments();
