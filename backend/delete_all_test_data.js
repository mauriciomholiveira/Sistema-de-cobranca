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
        console.log('🧹 Deleting ALL test data created by create_admin_tenant.js...');

        // 1. Delete test courses
        const testCourses = ['Piano', 'Violão', 'Bateria', 'Canto'];
        
        for (const courseName of testCourses) {
            const courseResult = await pool.query(`SELECT id FROM cursos WHERE nome = $1`, [courseName]);
            
            if (courseResult.rows.length > 0) {
                const courseId = courseResult.rows[0].id;
                
                // Delete in order: payments -> enrollments -> clients -> course
                await pool.query(`DELETE FROM pagamentos WHERE curso_id = $1`, [courseId]);
                await pool.query(`DELETE FROM matriculas WHERE curso_id = $1`, [courseId]);
                await pool.query(`DELETE FROM clientes WHERE curso_id = $1`, [courseId]);
                await pool.query(`DELETE FROM cursos WHERE id = $1`, [courseId]);
                
                console.log(`✅ Deleted course: ${courseName}`);
            } else {
                console.log(`ℹ️  Course not found: ${courseName}`);
            }
        }

        console.log('\n✅ All test data deleted!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
})();
