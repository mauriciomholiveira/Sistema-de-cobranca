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
        console.log('Creating test tenant with ISENTO payments...');

        // 1. Create test professor
        const hashSenha = await bcrypt.hash('teste123', 10);
        const profResult = await pool.query(`
            INSERT INTO professores (nome, email, senha, is_admin, can_send_messages, active)
            VALUES ('Professor Teste', 'teste@email.com', $1, FALSE, FALSE, TRUE)
            RETURNING id
        `, [hashSenha]);
        
        const profId = profResult.rows[0].id;
        console.log(`Professor created with ID: ${profId}`);

        // 2. Create test course
        const cursoResult = await pool.query(`
            INSERT INTO cursos (nome, mensalidade_padrao, active)
            VALUES ('Curso Teste ISENTO', 0, TRUE)
            RETURNING id
        `);
        
        const cursoId = cursoResult.rows[0].id;
        console.log(`Course created with ID: ${cursoId}`);

        // 3. Create test students with zero-value enrollments
        const alunos = [
            { nome: 'Aluno Isento 1', whatsapp: '11999999001' },
            { nome: 'Aluno Isento 2', whatsapp: '11999999002' },
            { nome: 'Aluno Isento 3', whatsapp: '11999999003' }
        ];

        for (const aluno of alunos) {
            // Create client
            const clienteResult = await pool.query(`
                INSERT INTO clientes (nome, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor, valor_igreja, active)
                VALUES ($1, $2, 0, 10, $3, $4, 0, 0, TRUE)
                RETURNING id
            `, [aluno.nome, aluno.whatsapp, profId, cursoId]);

            const clienteId = clienteResult.rows[0].id;

            // Create enrollment with zero value
            await pool.query(`
                INSERT INTO matriculas (cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active)
                VALUES ($1, $2, $3, 10, 0, 0, 0, TRUE)
            `, [clienteId, cursoId, profId]);

            console.log(`Created student: ${aluno.nome}`);
        }

        console.log('\n✅ Test tenant created successfully!');
        console.log('\nLogin credentials:');
        console.log('Email: teste@email.com');
        console.log('Password: teste123');
        console.log('\nAccess /cobranca to see ISENTO payments');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
})();
