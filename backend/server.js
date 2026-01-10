const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./src/database/db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// app.use(express.static('../frontend')); // Legacy frontend disabled

app.get('/', (req, res) => {
    res.json({ message: 'Sistema de Cobrança API Running 🚀' });
});

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

        // Revenue by Professor (This Month) - Only PAID
        const receitaProfessor = await db.query(`
            SELECT 
                p.nome, 
                SUM(pg.valor_professor_recebido) as total_professor,
                SUM(pg.valor_igreja_recebido) as total_igreja
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN professores p ON pg.professor_id = p.id
            WHERE pg.status = 'PAGO' AND pg.mes_ref = $1
            GROUP BY p.nome
        `, [mes]);

        // Calculate totals from the grouped data
        const totalProf = receitaProfessor.rows.reduce((acc, curr) => acc + parseFloat(curr.total_professor || 0), 0);
        const totalIgreja = receitaProfessor.rows.reduce((acc, curr) => acc + parseFloat(curr.total_igreja || 0), 0);

        const valRecebido = parseFloat(totalRecebido.rows[0].sum || 0);
        const valAReceber = parseFloat(totalAReceber.rows[0].sum || 0);

        res.json({
            mes_ref: mes,
            alunos: totalAlunos.rows[0].count,
            atrasados: totalAtrasados.rows[0].count,
            recebido: valRecebido,
            a_receber: valAReceber,
            previsao_total: valRecebido + valAReceber,
            isentos: totalIsentos.rows[0].count,
            total_professores: totalProf,
            total_igreja: totalIgreja,
            por_professor: receitaProfessor.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no dashboard' });
    }
});

// Professor Dashboard Metrics
app.get('/api/dashboard/professores', async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7);
        
        const query = `
            SELECT 
                p.id,
                p.nome,
                COUNT(DISTINCT m.cliente_id) FILTER (WHERE c.active = TRUE) as total_alunos,
                COALESCE(SUM(pag.valor_professor_recebido) FILTER (WHERE pag.status = 'PAGO'), 0) as a_receber,
                COALESCE(SUM(pag.valor_igreja_recebido) FILTER (WHERE pag.status = 'PAGO'), 0) as paga_igreja,
                COALESCE(SUM(pag.valor_cobrado) FILTER (WHERE pag.status IN ('PENDENTE', 'ATRASADO')), 0) as pendencias,
                COALESCE(SUM(pag.valor_cobrado), 0) as previsao_total
            FROM professores p
            LEFT JOIN matriculas m ON p.id = m.professor_id
            LEFT JOIN clientes c ON m.cliente_id = c.id AND c.active = TRUE
            LEFT JOIN pagamentos pag ON m.id = pag.matricula_id AND pag.mes_ref = $1
            WHERE p.active = TRUE
            GROUP BY p.id, p.nome
            ORDER BY p.nome
        `;
        
        const result = await db.query(query, [mes]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar métricas de professores' });
    }
});

// 2. Auxiliares (Professores/Cursos/Templates)
// 1. Professores
app.get('/api/professores', async (req, res) => {
    // Return all fields except password
    const result = await db.query('SELECT id, nome, email, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, active FROM professores WHERE active = TRUE ORDER BY nome');
    res.json(result.rows);
});

app.post('/api/professores', async (req, res) => {
    const { nome, email, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha } = req.body;
    
    let passwordHash = null;
    if (senha) {
        passwordHash = await bcrypt.hash(senha, 10);
    }

    try {
        await db.query(
            'INSERT INTO professores (nome, email, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
            [nome, email, data_nascimento, pix || null, cpf || null, contato || null, endereco || null, dados_bancarios || null, passwordHash]
        );
        res.status(201).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar professor' });
    }
});

app.put('/api/professores/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha, active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (data_nascimento !== undefined) { fields.push(`data_nascimento = $${idx++}`); values.push(data_nascimento); }
    if (pix !== undefined) { fields.push(`pix = $${idx++}`); values.push(pix); }
    if (cpf !== undefined) { fields.push(`cpf = $${idx++}`); values.push(cpf); }
    if (contato !== undefined) { fields.push(`contato = $${idx++}`); values.push(contato); }
    if (endereco !== undefined) { fields.push(`endereco = $${idx++}`); values.push(endereco); }
    if (dados_bancarios !== undefined) { fields.push(`dados_bancarios = $${idx++}`); values.push(dados_bancarios); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

    if (senha) {
        const hash = await bcrypt.hash(senha, 10);
        fields.push(`senha = $${idx++}`);
        values.push(hash);
    }

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

// 3. Clientes (Updated with Aggregation)
app.get('/api/clientes', async (req, res) => {
    // Join with matriculas to get aggregated course names and total value
    const query = `
        SELECT c.*, 
               COALESCE(SUM(m.valor_mensalidade), 0) as total_valor,
               STRING_AGG(DISTINCT cu.nome, ', ') as cursos_nomes
        FROM clientes c
        LEFT JOIN matriculas m ON c.id = m.cliente_id AND m.active = TRUE
        LEFT JOIN cursos cu ON m.curso_id = cu.id
        GROUP BY c.id
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

        // Clean up pending payments if deactivating
        if (active === false) {
            await db.query("DELETE FROM pagamentos WHERE cliente_id = $1 AND status = 'PENDENTE'", [id]);
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// Toggle Client Active Status
app.patch('/api/clientes/:id/toggle-active', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query(
            'UPDATE clientes SET active = NOT active WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        const client = result.rows[0];
        
        // Clean up pending payments if deactivating
        if (!client.active) {
            await db.query(
                "DELETE FROM pagamentos WHERE cliente_id = $1 AND status = 'PENDENTE'",
                [id]
            );
        }
        
        res.json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status do cliente' });
    }
});

// Delete Client (Permanent)
app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // First delete all related payments
        await db.query('DELETE FROM pagamentos WHERE matricula_id IN (SELECT id FROM matriculas WHERE cliente_id = $1)', [id]);
        
        // Then delete all enrollments
        await db.query('DELETE FROM matriculas WHERE cliente_id = $1', [id]);
        
        // Finally delete the client
        const result = await db.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        res.status(200).json({ message: 'Cliente excluído permanentemente' });
    } catch (err) {
        console.error('Error deleting client:', err);
        res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
});

// 4. Billing Logic (The Brain)
// Endpoint to list PAYMENTS for a specific month (or current)
app.get('/api/cobranca', async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7); // "2024-01"

        // 1. First, ensure payments exist for all active clients for this month
        // This is a "Lazy Generation" strategy: we check and create if missing when viewing the list
        // 1. First, ensure payments exist for all active MATRICULAS for this month
        // "Lazy Generation" strategy: check and create if missing
        await db.query(`
            INSERT INTO pagamentos (
                matricula_id, cliente_id, professor_id, curso_id, 
                mes_ref, valor_cobrado, data_vencimento, status,
                valor_professor_recebido, valor_igreja_recebido
            )
            SELECT 
                m.id, m.cliente_id, m.professor_id, m.curso_id,
                $1::varchar, 
                COALESCE(m.valor_mensalidade, 0), 
                TO_DATE($1::text || '-' || COALESCE(m.dia_vencimento, 10)::text, 'YYYY-MM-DD'), 
                'PENDENTE',
                COALESCE(m.valor_professor, 0), 
                COALESCE(m.valor_igreja, 0)
            FROM matriculas m
            JOIN clientes c ON m.cliente_id = c.id
            WHERE m.active = TRUE 
            AND c.active = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM pagamentos p
                WHERE p.cliente_id = m.cliente_id 
                AND p.curso_id = m.curso_id
                AND p.mes_ref = $1::varchar
            )
        `, [mes]);

        // 2. Fetch the payments with details (updated for Matriculas)
        // We construct a "Display Name" by appending Course Name if available
        const query = `
            SELECT 
                pg.*, 
                c.nome, 
                curr.nome as nome_curso,
                c.whatsapp, 
                prof.nome as nome_professor
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN matriculas m ON pg.matricula_id = m.id
            LEFT JOIN cursos curr ON pg.curso_id = curr.id
            LEFT JOIN professores prof ON pg.professor_id = prof.id
            WHERE pg.mes_ref = $1
            ORDER BY UPPER(c.nome) ASC
        `;


        const result = await db.query(query, [mes]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error in /api/cobranca:", err);
        res.status(500).json({ error: "Erro ao buscar cobranças." });
    }
});

app.put('/api/pagamentos/:id', async (req, res) => {
    try {
        const { 
            valor_cobrado, status, data_pagamento, 
            valor_professor_recebido, valor_igreja_recebido,
            msg_lembrete_enviada, msg_vencimento_enviada, msg_atraso_enviada 
        } = req.body;

        // Dynamic updates
        const fields = [];
        const values = [];
        let idx = 1;

        if (valor_cobrado !== undefined) { fields.push(`valor_cobrado = $${idx++}`); values.push(valor_cobrado); }
        if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
        if (data_pagamento !== undefined) { fields.push(`data_pagamento = $${idx++}`); values.push(data_pagamento); }
        if (valor_professor_recebido !== undefined) { fields.push(`valor_professor_recebido = $${idx++}`); values.push(valor_professor_recebido); }
        if (valor_igreja_recebido !== undefined) { fields.push(`valor_igreja_recebido = $${idx++}`); values.push(valor_igreja_recebido); }
        
        // Message tracking columns
        if (msg_lembrete_enviada !== undefined) { fields.push(`msg_lembrete_enviada = $${idx++}`); values.push(msg_lembrete_enviada); }
        if (msg_vencimento_enviada !== undefined) { fields.push(`msg_vencimento_enviada = $${idx++}`); values.push(msg_vencimento_enviada); }
        if (msg_atraso_enviada !== undefined) { fields.push(`msg_atraso_enviada = $${idx++}`); values.push(msg_atraso_enviada); }

        if (fields.length === 0) return res.status(400).send('No fields to update');

        values.push(req.params.id); // ID is last param

        await db.query(`UPDATE pagamentos SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        res.send();
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// --- MATRICULAS ENDPOINTS ---

// Get all matriculas for a client
app.get('/api/matriculas/:cliente_id', async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const result = await db.query(`
            SELECT m.*, c.nome as nome_curso, p.nome as nome_professor
            FROM matriculas m
            LEFT JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN professores p ON m.professor_id = p.id
            WHERE m.cliente_id = $1 AND m.active = TRUE
            ORDER BY m.id ASC
        `, [cliente_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar matrículas' });
    }
});

// Create new matricula
app.post('/api/matriculas', async (req, res) => {
    try {
        const { 
            cliente_id, curso_id, professor_id, 
            dia_vencimento, valor_mensalidade, 
            valor_professor, valor_igreja 
        } = req.body;

        const result = await db.query(`
            INSERT INTO matriculas (
                cliente_id, curso_id, professor_id, 
                dia_vencimento, valor_mensalidade, 
                valor_professor, valor_igreja, active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            RETURNING *
        `, [cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar matrícula' });
    }
});

// Update matricula
app.put('/api/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            curso_id, professor_id, 
            dia_vencimento, valor_mensalidade, 
            valor_professor, valor_igreja 
        } = req.body;

        const result = await db.query(`
            UPDATE matriculas SET
                curso_id = COALESCE($1, curso_id),
                professor_id = COALESCE($2, professor_id),
                dia_vencimento = COALESCE($3, dia_vencimento),
                valor_mensalidade = COALESCE($4, valor_mensalidade),
                valor_professor = COALESCE($5, valor_professor),
                valor_igreja = COALESCE($6, valor_igreja)
            WHERE id = $7
            RETURNING *
        `, [curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, id]);

        if (result.rowCount === 0) return res.status(404).send('Matrícula não encontrada');
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar matrícula' });
    }
});

// Delete matricula (Soft Delete)
app.delete('/api/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE matriculas SET active = FALSE WHERE id = $1', [id]);
        
        // Delete PENDING/LATE payments associated with this matricula
        // We keep PAID payments for history
        await db.query(`
            DELETE FROM pagamentos 
            WHERE matricula_id = $1 
            AND status != 'PAGO'
        `, [id]);
        
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir matrícula' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Clean up orphaned payments (Fix for zombie entries)
app.post('/api/cleanup-billing', async (req, res) => {
    try {
        const result = await db.query(`
            DELETE FROM pagamentos 
            WHERE matricula_id IN (SELECT id FROM matriculas WHERE active = FALSE)
            AND status != 'PAGO'
        `);
        console.log(`Cleaned up ${result.rowCount} orphaned payments.`);
        res.json({ message: `Removidos ${result.rowCount} pagamentos órfãos.` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao limpar pagamentos');
    }
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
