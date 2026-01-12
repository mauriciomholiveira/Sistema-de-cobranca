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
        console.log('🧹 Deleting test students created by create_admin_tenant.js...');

        // Delete the 10 specific students by name
        const testStudents = [
            'João Silva',
            'Maria Santos',
            'Pedro Oliveira',
            'Ana Costa',
            'Carlos Souza',
            'Juliana Lima',
            'Roberto Alves',
            'Fernanda Rocha',
            'Lucas Martins',
            'Patricia Dias'
        ];

        for (const studentName of testStudents) {
            // Get client ID
            const clientResult = await pool.query(`SELECT id FROM clientes WHERE nome = $1`, [studentName]);
            
            if (clientResult.rows.length > 0) {
                const clientId = clientResult.rows[0].id;
                
                // Delete in order: payments -> enrollments -> client
                await pool.query(`DELETE FROM pagamentos WHERE cliente_id = $1`, [clientId]);
                await pool.query(`DELETE FROM matriculas WHERE cliente_id = $1`, [clientId]);
                await pool.query(`DELETE FROM clientes WHERE id = $1`, [clientId]);
                
                console.log(`✅ Deleted: ${studentName}`);
            } else {
                console.log(`ℹ️  Not found: ${studentName}`);
            }
        }

        console.log('\n✅ Cleanup completed!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
})();
