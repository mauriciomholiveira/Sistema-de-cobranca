const db = require('./src/database/db');

async function checkIsentos() {
    try {
        // 1. Alunos com matrícula ativa mas SEM pagamento gerado
        const semPagamento = await db.query(`
            SELECT 
                c.nome as aluno,
                cu.nome as curso,
                p.nome as professor,
                m.valor_mensalidade
            FROM clientes c
            JOIN matriculas m ON c.id = m.cliente_id
            JOIN cursos cu ON m.curso_id = cu.id
            JOIN professores p ON m.professor_id = p.id
            WHERE m.active = TRUE
            AND c.active = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM pagamentos pg 
                WHERE pg.matricula_id = m.id 
                AND pg.mes_ref = '2026-01'
            )
            ORDER BY c.nome
        `);
        
        console.log('📋 ALUNOS ATIVOS SEM PAGAMENTO EM JAN/2026:');
        console.table(semPagamento.rows);
        
        // 2. Pagamentos com valor ZERO
        const zerados = await db.query(`
            SELECT 
                c.nome as aluno,
                cu.nome as curso,
                pg.valor_cobrado,
                pg.status
            FROM pagamentos pg
            JOIN matriculas m ON pg.matricula_id = m.id
            JOIN clientes c ON m.cliente_id = c.id
            JOIN cursos cu ON m.curso_id = cu.id
            WHERE pg.mes_ref = '2026-01'
            AND pg.valor_cobrado = 0
        `);
        
        console.log('\n💰 PAGAMENTOS COM VALOR ZERO (ISENTOS):');
        console.table(zerados.rows);
        
    } catch(e) { 
        console.error(e); 
    }
    process.exit();
}

checkIsentos();
