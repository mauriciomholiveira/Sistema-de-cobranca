const { Pool } = require('pg');

const pool = new Pool({
    user: 'cobranca_user',
    host: 'postgres',
    database: 'cobranca_db',
    password: 'cobranca_pass',
    port: 5432,
});

const data = [
    { nome: 'ALICE', telefone: '4898114035', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'AMINAH', telefone: '4898114035', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'CALLEB', telefone: '4884278014', professor: 'ABNER', valor: '130,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'DANILO', telefone: '4896163985', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'DAVI', telefone: '4891124058', professor: 'ABNER', valor: '130,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'DAVID', telefone: '4891564558', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'HENRY', telefone: '4884474129', professor: 'ABNER', valor: '130,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'ISABELA', telefone: '4888586721', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'KLEBER', telefone: '4899994329', professor: 'ABNER', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'Claudete', telefone: '4899425142', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'Claudinéia', telefone: '48999006020', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'DANIELA', telefone: '4891564558', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'Kaira', telefone: '4888596403', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'NICOLAS', telefone: '4891564558', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'Tayna', telefone: '48999613305', professor: 'ALEX', valor: '150,00', curso: 'CANTO', vencimento: 10 },
    { nome: 'ADRIAN', telefone: '4888208803', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'CARLOS', telefone: '4896129937', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'DANIELA', telefone: '4891564558', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'DANIELA', telefone: '4891564558', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'HENRI', telefone: '4888586721', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'HENRIQUE', telefone: '4896861213', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'ISMAEL', telefone: '4892078003', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'LAVINIA', telefone: '4891369464', professor: 'ALEXANDRE', valor: '130,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'MATHEUS', telefone: '4891225387', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 },
    { nome: 'NATHAN', telefone: '4891564558', professor: 'ALEXANDRE', valor: '110,00', curso: 'INSTRUMENTO', vencimento: 10 }
];

async function importData() {
    try {
        console.log('Iniciando importação...');

        // 1. Map Resources
        const profRes = await pool.query('SELECT id, nome FROM professores');
        const courseRes = await pool.query('SELECT id, nome FROM cursos');

        const professors = profRes.rows;
        const courses = courseRes.rows;

        console.log('Professores encontrados:', professors.map(p => p.nome).join(', '));
        console.log('Cursos encontrados:', courses.map(c => c.nome).join(', '));

        for (const item of data) {
            // Find IDs
            // Loose matching for ABNER -> Aber
            const prof = professors.find(p => {
                const pName = p.nome.toLowerCase();
                const iName = item.professor.toLowerCase();
                return pName.includes(iName) || iName.includes(pName) || (iName === 'abner' && pName === 'aber');
            });

            const course = courses.find(c => c.nome.toLowerCase() === item.curso.toLowerCase());

            if (!prof) {
                console.error(`Professor não encontrado: ${item.professor}`);
                continue;
            }
            if (!course) {
                console.error(`Curso não encontrado: ${item.curso}`);
                continue;
            }

            // Clean Value
            const numericValue = parseFloat(item.valor.replace('R$', '').replace('.', '').replace(',', '.'));

            // 2. Insert Client (or get ID)
            // Check if client exists by phone + name to avoid duplicating strictly identical people
            // But allows same person multiple times if needed, we'll implement "Get or Create" logic loosely
            let clientId;
            const clientCheck = await pool.query('SELECT id FROM clientes WHERE nome = $1 AND whatsapp = $2', [item.nome, item.telefone]);
            
            if (clientCheck.rows.length > 0) {
                clientId = clientCheck.rows[0].id;
                console.log(`Cliente existente: ${item.nome} (ID: ${clientId})`);
            } else {
                const newClient = await pool.query(
                    'INSERT INTO clientes (nome, whatsapp, active) VALUES ($1, $2, TRUE) RETURNING id',
                    [item.nome, item.telefone]
                );
                clientId = newClient.rows[0].id;
                console.log(`Novo cliente criado: ${item.nome} (ID: ${clientId})`);
            }

            // 3. Create Matricula
            // We insert a new matricula for every line. If user is enrolled in multiple courses/profs, they get multiple matriculas.
            await pool.query(
                `INSERT INTO matriculas (
                    cliente_id, professor_id, curso_id, 
                    valor_mensalidade, dia_vencimento, 
                    valor_professor, valor_igreja, active
                ) VALUES ($1, $2, $3, $4, $5, 0, 0, TRUE)`,
                [clientId, prof.id, course.id, numericValue, item.vencimento]
            );

            console.log(`Matrícula criada: ${item.nome} -> ${prof.nome} (${item.curso}) - R$ ${numericValue}`);
        }

        console.log('Importação concluída com sucesso!');
    } catch (err) {
        console.error('Erro fatal:', err);
    } finally {
        await pool.end();
    }
}

importData();
