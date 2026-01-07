const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'cobranca_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'cobranca_db',
    password: process.env.POSTGRES_PASSWORD || 'cobranca_pass',
    port: process.env.DB_PORT || 5432,
});

async function debug() {
    try {
        console.log('--- Debugging Daniela ---');
        // Find Daniela
        const clientRes = await pool.query("SELECT * FROM clientes WHERE nome ILIKE '%Daniela%'");
        if (clientRes.rows.length === 0) {
            console.log('Client Daniela not found');
            return;
        }
        const client = clientRes.rows[0];
        console.log(`Found Client: ${client.nome} (ID: ${client.id})`);

        // Check Matriculas
        const matRes = await pool.query("SELECT * FROM matriculas WHERE cliente_id = $1", [client.id]);
        console.log(`\nMatriculas for ${client.nome}:`);
        matRes.rows.forEach(m => {
            console.log(`- ID: ${m.id}, Course: ${m.curso_id} (Type: ${m.nome_curso || '?'}), Active: ${m.active}`);
        });

        // Check Payments
        const payRes = await pool.query("SELECT * FROM pagamentos WHERE cliente_id = $1", [client.id]);
        console.log(`\nPayments for ${client.nome}:`);
        payRes.rows.forEach(p => {
            console.log(`- ID: ${p.id}, Due: ${p.data_vencimento}, Status: ${p.status}, MatriculaID: ${p.matricula_id}`);
        });

        // Test Cleanup Query
        console.log('\n--- Simulation: Cleanup Query ---');
        const countRes = await pool.query(`
            SELECT COUNT(*) FROM pagamentos 
            WHERE matricula_id IN (SELECT id FROM matriculas WHERE active = FALSE)
            AND status != 'PAGO'
        `);
        console.log(`Potentially removable payments (orphans): ${countRes.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

debug();
