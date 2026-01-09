const db = require('./src/database/db');

async function diagnostico() {
    try {
        console.log("=== DIAGNÓSTICO DE VALORES ===\n");
        
        // 1. Total por Status
        const porStatus = await db.query(`
            SELECT 
                status,
                COUNT(*) as qtd,
                SUM(valor_cobrado) as total
            FROM pagamentos
            WHERE mes_ref = '2026-01'
            GROUP BY status
            ORDER BY status
        `);
        
        console.log("📊 TOTAIS POR STATUS:");
        console.table(porStatus.rows);
        
        // 2. Soma Geral
        const somaGeral = await db.query(`
            SELECT 
                SUM(valor_cobrado) as total_geral,
                COUNT(*) as total_pagamentos
            FROM pagamentos
            WHERE mes_ref = '2026-01'
        `);
        
        console.log("\n💰 SOMA GERAL:");
        console.table(somaGeral.rows);
        
        // 3. Detalhes dos Pagamentos
        const detalhes = await db.query(`
            SELECT 
                c.nome as aluno,
                cu.nome as curso,
                p.nome as professor,
                pg.valor_cobrado,
                pg.status
            FROM pagamentos pg
            JOIN matriculas m ON pg.matricula_id = m.id
            JOIN clientes c ON m.cliente_id = c.id
            JOIN cursos cu ON m.curso_id = cu.id
            JOIN professores p ON m.professor_id = p.id
            WHERE pg.mes_ref = '2026-01'
            ORDER BY c.nome
        `);
        
        console.log("\n📋 DETALHES DOS PAGAMENTOS:");
        console.table(detalhes.rows);
        
    } catch (e) {
        console.error("Erro:", e);
    } finally {
        process.exit();
    }
}

diagnostico();
