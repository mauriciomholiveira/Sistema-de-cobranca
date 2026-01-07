const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Template API
app.get('/api/templates/:type', (req, res) => {
    try {
        const templatePath = path.join(__dirname, '..', 'templates', `${req.params.type}.txt`);
        const template = fs.readFileSync(templatePath, 'utf8');
        res.send(template);
    } catch (error) {
        res.status(404).send('Template not found');
    }
});

// --- Routes V2 ---

// 1. Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7); // "2024-01"

        // Basic Counters
        const totalAlunos = await db.query('SELECT COUNT(*) FROM clientes WHERE active = TRUE');

        // Stats for the SPECIFIC MONTH
        const totalAtrasados = await db.query(
            "SELECT COUNT(*) FROM pagamentos WHERE status = 'ATRASADO' AND mes_ref = $1",
            [mes]
        );
        const totalRecebido = await db.query(
            "SELECT SUM(valor_cobrado) FROM pagamentos WHERE status = 'PAGO' AND mes_ref = $1",
            [mes]
        );
        const totalAReceber = await db.query(
            "SELECT SUM(valor_cobrado) FROM pagamentos WHERE status != 'PAGO' AND mes_ref = $1",
            [mes]
        );
        const totalIsentos = await db.query(
            "SELECT COUNT(*) FROM pagamentos WHERE valor_cobrado = 0 AND mes_ref = $1",
            [mes]
        );

        // Revenue by Professor (This Month)
        const receitaProfessor = await db.query(`
            SELECT p.nome, SUM(pg.valor_cobrado) as total 
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN professores p ON c.professor_id = p.id
            WHERE pg.status = 'PAGO' AND pg.mes_ref = $1
            GROUP BY p.nome
        `, [mes]);

        res.json({
            mes_ref: mes,
            alunos: totalAlunos.rows[0].count,
            atrasados: totalAtrasados.rows[0].count,
            recebido: totalRecebido.rows[0].sum || 0,
            a_receber: totalAReceber.rows[0].sum || 0,
            isentos: totalIsentos.rows[0].count,
            por_professor: receitaProfessor.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no dashboard' });
    }
});

// 2. Auxiliares (Professores/Cursos/Templates)
app.get('/api/professores', async (req, res) => {
    const result = await db.query('SELECT * FROM professores WHERE active = TRUE ORDER BY nome');
    res.json(result.rows);
});

app.post('/api/professores', async (req, res) => {
    const { nome, pix } = req.body;
    await db.query('INSERT INTO professores (nome, pix) VALUES ($1, $2)', [nome, pix || null]);
    res.status(201).send();
});

app.put('/api/professores/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, pix, active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (pix !== undefined) { fields.push(`pix = $${idx++}`); values.push(pix); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

    if (fields.length === 0) return res.status(400).send('No fields to update');

    values.push(id);

    try {
        await db.query(`UPDATE professores SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar professor' });
    }
});

app.get('/api/cursos', async (req, res) => {
    const result = await db.query('SELECT * FROM cursos WHERE active = TRUE ORDER BY nome');
    res.json(result.rows);
});

app.post('/api/cursos', async (req, res) => {
    const { nome, mensalidade_padrao } = req.body;
    await db.query('INSERT INTO cursos (nome, mensalidade_padrao) VALUES ($1, $2)', [nome, mensalidade_padrao]);
    res.status(201).send();
});

app.put('/api/cursos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, mensalidade_padrao, active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (mensalidade_padrao !== undefined) { fields.push(`mensalidade_padrao = $${idx++}`); values.push(mensalidade_padrao); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

    if (fields.length === 0) return res.status(400).send('No fields to update');

    values.push(id);

    try {
        await db.query(`UPDATE cursos SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar curso' });
    }
});

app.get('/api/templates', async (req, res) => {
    const result = await db.query('SELECT * FROM templates_mensagem ORDER BY id');
    res.json(result.rows);
});

// 3. Clientes (Updated)
app.get('/api/clientes', async (req, res) => {
    // Join with Professor/Curso for display
    const query = `
        SELECT c.*, p.nome as nome_professor, cu.nome as nome_curso 
        FROM clientes c
        LEFT JOIN professores p ON c.professor_id = p.id
        LEFT JOIN cursos cu ON c.curso_id = cu.id
        ORDER BY c.nome ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
});

app.post('/api/clientes', async (req, res) => {
    const { nome, endereco, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor, valor_igreja } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO clientes (nome, endereco, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor, valor_igreja) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [nome, endereco, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor || valor_padrao, valor_igreja || 0]
        );
        // TODO: Generate first payment instantly? (Optional, let's leave for the "Generator" logic)
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar' });
    }
});

// Update Client (Edit or Deactivate)
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, endereco, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, active, valor_professor, valor_igreja } = req.body;

    // Dynamic Query Construction
    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (endereco !== undefined) { fields.push(`endereco = $${idx++}`); values.push(endereco); }
    if (whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); values.push(whatsapp); }
    if (valor_padrao !== undefined) { fields.push(`valor_padrao = $${idx++}`); values.push(valor_padrao); }
    if (dia_vencimento !== undefined) { fields.push(`dia_vencimento = $${idx++}`); values.push(dia_vencimento); }
    if (professor_id !== undefined) { fields.push(`professor_id = $${idx++}`); values.push(professor_id); }
    if (curso_id !== undefined) { fields.push(`curso_id = $${idx++}`); values.push(curso_id); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
    if (valor_professor !== undefined) { fields.push(`valor_professor = $${idx++}`); values.push(valor_professor); }
    if (valor_igreja !== undefined) { fields.push(`valor_igreja = $${idx++}`); values.push(valor_igreja); }

    if (fields.length === 0) return res.status(400).send('No fields to update');

    values.push(id);

    try {
        await db.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// 4. Billing Logic (The Brain)
// Endpoint to list PAYMENTS for a specific month (or current)
app.get('/api/cobranca', async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7); // "2024-01"

        // 1. First, ensure payments exist for all active clients for this month
        // This is a "Lazy Generation" strategy: we check and create if missing when viewing the list
        await db.query(`
            INSERT INTO pagamentos (cliente_id, mes_ref, valor_cobrado, data_vencimento, status)
            SELECT id, $1::varchar, valor_padrao, 
                TO_DATE($1::text || '-' || dia_vencimento::text, 'YYYY-MM-DD'), 
                'PENDENTE'
            FROM clientes 
            WHERE active = TRUE 
            AND NOT EXISTS (
                SELECT 1 FROM pagamentos WHERE cliente_id = clientes.id AND mes_ref = $1::varchar
            )
        `, [mes]);

        // 2. Fetch the payments with details
        const query = `
            SELECT pg.*, c.nome, c.whatsapp, p.nome as nome_professor
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN professores p ON c.professor_id = p.id
            WHERE pg.mes_ref = $1
            ORDER BY pg.data_vencimento ASC
        `;

        const result = await db.query(query, [mes]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error in /api/cobranca:", err);
        res.status(500).json({ error: "Erro ao buscar cobranças." });
    }
});

app.put('/api/pagamentos/:id', async (req, res) => {
    const { valor_cobrado, status, data_pagamento, valor_professor_recebido, valor_igreja_recebido } = req.body;
    // Dynamic updates
    const fields = [];
    const values = [];
    let idx = 1;

    if (valor_cobrado !== undefined) { fields.push(`valor_cobrado = $${idx++}`); values.push(valor_cobrado); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
    if (data_pagamento !== undefined) { fields.push(`data_pagamento = $${idx++}`); values.push(data_pagamento); }
    if (valor_professor_recebido !== undefined) { fields.push(`valor_professor_recebido = $${idx++}`); values.push(valor_professor_recebido); }
    if (valor_igreja_recebido !== undefined) { fields.push(`valor_igreja_recebido = $${idx++}`); values.push(valor_igreja_recebido); }

    values.push(req.params.id); // ID is last param

    await db.query(`UPDATE pagamentos SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    res.send();
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Temporary migration endpoint (remove after use)
app.post('/api/migrate', async (req, res) => {
    try {
        // Add active column to professores
        await db.query('ALTER TABLE professores ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE');

        // Add active column to cursos
        await db.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE');

        // Add pix column to professores
        await db.query('ALTER TABLE professores ADD COLUMN IF NOT EXISTS pix VARCHAR(255)');

        // Update existing records
        await db.query('UPDATE professores SET active = TRUE WHERE active IS NULL');
        await db.query('UPDATE cursos SET active = TRUE WHERE active IS NULL');

        // Add revenue split columns to clientes
        await db.query('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS valor_professor DECIMAL(10,2)');
        await db.query('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS valor_igreja DECIMAL(10,2)');

        // Add revenue tracking to pagamentos
        await db.query('ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_professor_recebido DECIMAL(10,2)');
        await db.query('ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_igreja_recebido DECIMAL(10,2)');

        // Update existing clients with default split (professor gets all)
        await db.query('UPDATE clientes SET valor_professor = valor_padrao, valor_igreja = 0 WHERE valor_professor IS NULL');

        res.json({ success: true, message: 'All migrations completed successfully!' });
    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Apply revenue split to all pending payments for a client
app.put('/api/clientes/:id/aplicar-divisao', async (req, res) => {
    try {
        const clientId = req.params.id;

        // Get client's reference values
        const clientResult = await db.query(
            'SELECT valor_professor, valor_igreja, valor_padrao FROM clientes WHERE id = $1',
            [clientId]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).send('Cliente não encontrado');
        }

        const { valor_professor, valor_igreja, valor_padrao } = clientResult.rows[0];

        // Update all PENDING payments for this client
        const updateResult = await db.query(
            `UPDATE pagamentos 
             SET valor_professor_recebido = $1, 
                 valor_igreja_recebido = $2,
                 valor_cobrado = $3
             WHERE cliente_id = $4 
             AND status = 'PENDENTE'`,
            [valor_professor, valor_igreja, valor_padrao, clientId]
        );

        res.json({
            updated: updateResult.rowCount,
            valor_professor,
            valor_igreja
        });
    } catch (err) {
        console.error('Error applying revenue split:', err);
        res.status(500).send('Erro ao aplicar divisão');
    }
});
