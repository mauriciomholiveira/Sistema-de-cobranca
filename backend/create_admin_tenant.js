const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
        console.log('🧹 Cleaning test data...');

        // 1. Get test professor ID first
        const testProf = await pool.query(`SELECT id FROM professores WHERE email = 'teste@email.com'`);
        if (testProf.rows.length > 0) {
            const testProfId = testProf.rows[0].id;
            
            // Delete in correct order: payments -> enrollments -> clients -> professor
            await pool.query(`DELETE FROM pagamentos WHERE professor_id = $1`, [testProfId]);
            await pool.query(`DELETE FROM matriculas WHERE professor_id = $1`, [testProfId]);
            await pool.query(`DELETE FROM clientes WHERE professor_id = $1`, [testProfId]);
            await pool.query(`DELETE FROM professores WHERE id = $1`, [testProfId]);
            console.log('✅ Test professor and related data deleted');
        } else {
            console.log('ℹ️  No test professor found');
        }

        // 2. Get admin professor ID
        const adminResult = await pool.query(`SELECT id FROM professores WHERE email = 'admin@email.com'`);
        if (adminResult.rows.length === 0) {
            console.error('❌ Admin not found!');
            return;
        }
        const adminId = adminResult.rows[0].id;
        console.log(`✅ Admin ID: ${adminId}`);

        // 3. Create realistic courses
        const courses = [
            { nome: 'Piano', mensalidade: 200 },
            { nome: 'Violão', mensalidade: 150 },
            { nome: 'Bateria', mensalidade: 180 },
            { nome: 'Canto', mensalidade: 160 }
        ];

        const courseIds = [];
        for (const course of courses) {
            // Check if course exists
            const existing = await pool.query(`SELECT id FROM cursos WHERE nome = $1`, [course.nome]);
            if (existing.rows.length > 0) {
                courseIds.push(existing.rows[0].id);
            } else {
                const result = await pool.query(`
                    INSERT INTO cursos (nome, mensalidade_padrao, active)
                    VALUES ($1, $2, TRUE)
                    RETURNING id
                `, [course.nome, course.mensalidade]);
                courseIds.push(result.rows[0].id);
            }
        }
        console.log(`✅ Created ${courseIds.length} courses`);

        // 4. Create 10 realistic students
        const students = [
            { nome: 'João Silva', whatsapp: '11987654321', curso_idx: 0, valor: 200, dia: 5, status: 'PAGO' },
            { nome: 'Maria Santos', whatsapp: '11987654322', curso_idx: 1, valor: 150, dia: 10, status: 'PENDENTE' },
            { nome: 'Pedro Oliveira', whatsapp: '11987654323', curso_idx: 2, valor: 180, dia: 15, status: 'ATRASADO' },
            { nome: 'Ana Costa', whatsapp: '11987654324', curso_idx: 3, valor: 160, dia: 20, status: 'PAGO' },
            { nome: 'Carlos Souza', whatsapp: '11987654325', curso_idx: 0, valor: 0, dia: 5, status: 'ISENTO' },
            { nome: 'Juliana Lima', whatsapp: '11987654326', curso_idx: 1, valor: 150, dia: 10, status: 'PENDENTE' },
            { nome: 'Roberto Alves', whatsapp: '11987654327', curso_idx: 2, valor: 180, dia: 15, status: 'PAGO' },
            { nome: 'Fernanda Rocha', whatsapp: '11987654328', curso_idx: 3, valor: 0, dia: 20, status: 'ISENTO' },
            { nome: 'Lucas Martins', whatsapp: '11987654329', curso_idx: 0, valor: 200, dia: 5, status: 'ATRASADO' },
            { nome: 'Patricia Dias', whatsapp: '11987654330', curso_idx: 1, valor: 150, dia: 10, status: 'PAGO' }
        ];

        for (const student of students) {
            const cursoId = courseIds[student.curso_idx];
            
            // Create client
            const clienteResult = await pool.query(`
                INSERT INTO clientes (nome, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor, valor_igreja, active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                RETURNING id
            `, [student.nome, student.whatsapp, student.valor, student.dia, adminId, cursoId, student.valor * 0.7, student.valor * 0.3]);

            const clienteId = clienteResult.rows[0].id;

            // Create enrollment
            await pool.query(`
                INSERT INTO matriculas (cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            `, [clienteId, cursoId, adminId, student.dia, student.valor, student.valor * 0.7, student.valor * 0.3]);

            console.log(`✅ Created student: ${student.nome} (${student.status})`);
        }

        console.log('\n🎉 Admin tenant created successfully!');
        console.log('\nLogin as admin@email.com to see the data');
        console.log('You should see:');
        console.log('- 4 PAGO (Paid)');
        console.log('- 2 PENDENTE (Pending)');
        console.log('- 2 ATRASADO (Overdue)');
        console.log('- 2 ISENTO (Exempt)');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
})();
