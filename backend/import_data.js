const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Config from .env or hardcoded for dev environment matching docker-compose
const dbConfig = {
    user: process.env.DB_USER || 'cobranca_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cobranca_db',
    password: process.env.DB_PASSWORD || 'cobranca_pass',
    port: process.env.DB_PORT || 5432,
};

const client = new Client(dbConfig);

const parseCurrency = (str) => {
    if (!str) return 0;
    // Remove "R$", spaces, dots (thousands), replace comma with dot
    // But wait, "1.000,00".
    // Simple approach for "R$110,00" -> "110.00"
    let clean = str.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
    return parseFloat(clean) || 0;
};

const cleanText = (str) => {
    if (!str) return null;
    return str.replace(/<[^>]*>/g, '').trim(); // Remove tags if any remain
};

async function run() {
    try {
        await client.connect();
        console.log("📦 Connected to DB");

        const htmlPath = path.join(__dirname, '../COBRANÇA.html');
        if (!fs.existsSync(htmlPath)) {
            console.error("File not found:", htmlPath);
            return;
        }

        const html = fs.readFileSync(htmlPath, 'utf8');

        // Regex to find rows
        const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

        if (!rows) {
            console.log("No rows found");
            return;
        }

        // Cache for IDs
        const profMap = new Map();
        const courseMap = new Map();

        // Process ROWS (Skip header, usually index 0 and 1 in this file have headers/styles)
        // Looking at file, first row is header.

        // Let's start from index 0 and detect data.
        for (let i = 0; i < rows.length; i++) {
            const rowHtml = rows[i];
            // Extract columns
            const cols = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (!cols || cols.length < 5) continue;

            // Clean columns (strip tags)
            const getCol = (idx) => {
                if (!cols[idx]) return '';
                return cols[idx].replace(/<[^>]*>/g, '').trim();
            };

            const nome = getCol(0);
            if (nome === 'NOME' || !nome) continue; // Skip Header

            const telefone = getCol(1).replace(/\D/g, '');
            const diaVenc = parseInt(getCol(3)) || 10;
            const valorStr = getCol(4);
            const valor = parseCurrency(valorStr);
            const curso = getCol(5) || 'Geral';
            const professor = getCol(6) || 'Geral';
            const endereco = getCol(7) === 'sem endereco' ? '' : getCol(7);

            const statusDez = getCol(8); // DEZ 2025
            const statusJan = getCol(9); // JAN 2026

            console.log(`Processing: ${nome}`);

            // 1. Professor
            let profId = profMap.get(professor);
            if (!profId) {
                // Check DB
                const res = await client.query('SELECT id FROM professores WHERE nome = $1', [professor]);
                if (res.rows.length > 0) {
                    profId = res.rows[0].id;
                } else {
                    const ins = await client.query('INSERT INTO professores (nome) VALUES ($1) RETURNING id', [professor]);
                    profId = ins.rows[0].id;
                }
                profMap.set(professor, profId);
            }

            // 2. Course
            let courseId = courseMap.get(curso);
            if (!courseId) {
                const res = await client.query('SELECT id FROM cursos WHERE nome = $1', [curso]);
                if (res.rows.length > 0) {
                    courseId = res.rows[0].id;
                } else {
                    const ins = await client.query('INSERT INTO cursos (nome, mensalidade_padrao) VALUES ($1, $2) RETURNING id', [curso, valor]);
                    courseId = ins.rows[0].id;
                }
                courseMap.set(curso, courseId);
            }

            // 3. Client
            // Check existence by name (or phone?)
            let clientId;
            const resClient = await client.query('SELECT id FROM clientes WHERE nome = $1', [nome]);
            if (resClient.rows.length > 0) {
                // Update?
                clientId = resClient.rows[0].id;
                await client.query(`
                    UPDATE clientes SET 
                    whatsapp = $1, endereco = $2, valor_padrao = $3, dia_vencimento = $4, professor_id = $5, curso_id = $6
                    WHERE id = $7
                `, [telefone, endereco, valor, diaVenc, profId, courseId, clientId]);
            } else {
                const ins = await client.query(`
                    INSERT INTO clientes (nome, whatsapp, endereco, valor_padrao, dia_vencimento, professor_id, curso_id, active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id
                `, [nome, telefone, endereco, valor, diaVenc, profId, courseId]);
                clientId = ins.rows[0].id;
            }

            // 4. Payments
            const upsertPayment = async (mesRef, statusCell) => {
                if (!statusCell) return;

                let finalStatus = 'PENDENTE';
                let finalValor = valor;
                let dataPagamento = null;

                const upper = statusCell.toUpperCase();

                if (upper.includes('PAGO')) {
                    finalStatus = 'PAGO';
                    // "PAGO R$110" -> Extract 110?
                    // If it has numbers, try parsing
                    if (/\d/.test(statusCell)) {
                        // Extract numbers?
                        // Simple check: if it says "R$50,00"
                        // But usually it's just PAGO.
                    }
                    dataPagamento = new Date().toISOString().slice(0, 10); // Today as generic date? Or just allow null/default?
                    // Ideally we'd know the date, but for import let's use 1st of next month or something?
                    // Better: leave data_pagamento null IF schema allows, or use 1st of that month?
                    // Schema: data_pagamento DATE
                    // Let's set to last day of that month to be safe?
                    const [y, m] = mesRef.split('-');
                    dataPagamento = `${y}-${m}-28`; // Random date
                } else if (upper.includes('ISENTO')) {
                    finalStatus = 'PAGO'; // Treated as paid/resolved
                    finalValor = 0;
                    dataPagamento = `${mesRef}-28`;
                }

                // Check existence
                const resPg = await client.query('SELECT id FROM pagamentos WHERE cliente_id = $1 AND mes_ref = $2', [clientId, mesRef]);
                if (resPg.rows.length === 0) {
                    await client.query(`
                        INSERT INTO pagamentos (cliente_id, mes_ref, valor_cobrado, data_vencimento, status, data_pagamento)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        clientId,
                        mesRef,
                        finalValor,
                        `${mesRef}-${diaVenc}`,
                        finalStatus,
                        dataPagamento
                    ]);
                } else {
                    // Update existing to match sheet
                    await client.query(`
                       UPDATE pagamentos SET status = $1, valor_cobrado = $2, data_pagamento = $3
                       WHERE id = $4
                   `, [finalStatus, finalValor, dataPagamento, resPg.rows[0].id]);
                }
            };

            await upsertPayment('2025-12', statusDez);
            await upsertPayment('2026-01', statusJan);
        }

        console.log("✅ Import Finished!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
