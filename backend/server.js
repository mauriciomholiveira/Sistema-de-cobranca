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

// Auth Configuration
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/authMiddleware');
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_seguro';

// --- AUTH ROUTES ---

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const result = await db.query('SELECT * FROM professores WHERE email = $1', [email]);
        const professor = result.rows[0];

        if (!professor) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Validação de senha
        // Se a senha no banco não começar com $2, assume que é legado (texto plano)
        const isMatch = professor.senha && professor.senha.startsWith('$2') 
            ? await bcrypt.compare(senha, professor.senha)
            : professor.senha === senha;

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (professor.active === false) {
             return res.status(403).json({ message: 'Usuário inativo.' });
        }

        const token = jwt.sign(
            { 
                id: professor.id, 
                nome: professor.nome, 
                email: professor.email,
                is_admin: professor.is_admin // Add to token payload
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Remove senha antes de enviar
        delete professor.senha;

        res.json({ token, user: professor });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Verify Token (Me)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nome, email, whatsapp, active, is_admin FROM professores WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        
        if (!user) {
             return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
});

// --- END AUTH ROUTES ---

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
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7); // "2024-01"
        const professorId = req.user.id;
        const isAdmin = req.user.is_admin;

        // Basic Counters (Active Clients)
        let totalAlunos;
        if (isAdmin) {
             // Admin sees ALL active clients
             totalAlunos = await db.query('SELECT COUNT(*) FROM clientes WHERE active = TRUE');
        } else {
             // Professor sees only HIS students (via matriculas)
             totalAlunos = await db.query(`
                SELECT COUNT(DISTINCT c.id) 
                FROM clientes c
                JOIN matriculas m ON c.id = m.cliente_id
                WHERE c.active = TRUE AND m.active = TRUE AND m.professor_id = $1
            `, [professorId]);
        }

        // Stats for the SPECIFIC MONTH
        // Helper to append filter
        const filter = isAdmin ? "" : "AND professor_id = $2";
        const params = isAdmin ? [mes] : [mes, professorId];

        const totalAtrasados = await db.query(
            `SELECT COUNT(*) FROM pagamentos WHERE status = 'ATRASADO' AND mes_ref = $1 ${filter}`,
            params
        );
        
        // 1. Recebido (Realizado)
        const totalRecebido = await db.query(
            isAdmin 
                ? "SELECT SUM(valor_cobrado) FROM pagamentos WHERE status = 'PAGO' AND mes_ref = $1"
                : "SELECT SUM(valor_professor_recebido) FROM pagamentos WHERE status = 'PAGO' AND mes_ref = $1 AND professor_id = $2",
            params
        );
        
        const totalAReceber = await db.query(
             isAdmin
                ? "SELECT SUM(valor_cobrado) FROM pagamentos WHERE status != 'PAGO' AND mes_ref = $1"
                : "SELECT SUM(valor_professor_recebido) FROM pagamentos WHERE status != 'PAGO' AND mes_ref = $1 AND professor_id = $2",
            params
        );

        const totalIsentos = await db.query(
            `SELECT COUNT(*) FROM pagamentos WHERE valor_cobrado = 0 AND mes_ref = $1 ${filter}`,
            params
        );

        // 2. Previsão Geral (Forecast) = Total que DEVERIA entrar (Pago + Pendente + Atrasado)
        // Admin: Previsão Escola = Soma de valor_cobrado de todos
        // Professor: Previsão Dele = Soma de valor_professor_recebido de todos
        // FIX: Using COALESCE to handle cases where split columns are NULL (legacy or pending).
        // Default assumption: If split is missing, full amount goes to Professor (Safe fallback).
        
        const previsaoGeralQuery = isAdmin
            ? "SELECT SUM(valor_cobrado) as total, SUM(COALESCE(valor_professor_recebido, valor_cobrado)) as prof_share, SUM(COALESCE(valor_igreja_recebido, 0)) as church_share FROM pagamentos WHERE mes_ref = $1"
            : "SELECT SUM(COALESCE(valor_professor_recebido, valor_cobrado)) as total, SUM(COALESCE(valor_professor_recebido, valor_cobrado)) as prof_share, 0 as church_share FROM pagamentos WHERE mes_ref = $1 AND professor_id = $2";
            
        const previsaoGeral = await db.query(previsaoGeralQuery, params);
        
        const previsaoTotal = parseFloat(previsaoGeral.rows[0].total || 0);
        const previsaoProfessores = parseFloat(previsaoGeral.rows[0].prof_share || 0);
        const previsaoIgreja = parseFloat(previsaoGeral.rows[0].church_share || 0);

        // 3. Receita Por Professor (Realizado/Pago) - Para tabela/detalhes
        const receitaProfessor = await db.query(`
            SELECT 
                p.nome, 
                SUM(pg.valor_professor_recebido) as total_professor,
                SUM(pg.valor_igreja_recebido) as total_igreja
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN professores p ON pg.professor_id = p.id
            WHERE pg.status = 'PAGO' AND pg.mes_ref = $1 ${isAdmin ? "" : "AND pg.professor_id = $2"}
            GROUP BY p.nome
        `, params);

        // Totais REALIZADOS (Pagos)
        const totalProfPago = receitaProfessor.rows.reduce((acc, curr) => acc + parseFloat(curr.total_professor || 0), 0);
        const totalIgrejaPago = receitaProfessor.rows.reduce((acc, curr) => acc + parseFloat(curr.total_igreja || 0), 0);

        const valRecebido = parseFloat(totalRecebido.rows[0].sum || 0);
        const valAReceber = parseFloat(totalAReceber.rows[0].sum || 0);

        res.json({
            mes_ref: mes,
            alunos: totalAlunos.rows[0].count,
            atrasados: totalAtrasados.rows[0].count,
            recebido: valRecebido,
            a_receber: valAReceber,
            previsao_total: previsaoTotal, // Forecast Total (Paid + Pending)
            isentos: totalIsentos.rows[0].count,
            
            // Forecasts
            previsao_professores: previsaoProfessores, // Forecast Share Professors
            previsao_igreja: previsaoIgreja,           // Forecast Share Church
            
            // Realized (Paid) - Used in bottom cards
            total_professores_pago: totalProfPago,
            total_igreja_pago: totalIgrejaPago,
            
            por_professor: receitaProfessor.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no dashboard' });
    }
});

// Professor Dashboard Metrics
app.get('/api/dashboard/professores', authenticateToken, async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7);
        const professorId = req.user.id;
        const isAdmin = req.user.is_admin;
        
        const filter = isAdmin ? "" : "AND p.id = $2";
        const params = isAdmin ? [mes] : [mes, professorId];
        
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
            WHERE p.active = TRUE ${filter}
            GROUP BY p.id, p.nome
            ORDER BY p.nome
        `;
        
        const result = await db.query(query, params);
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
    const result = await db.query('SELECT id, nome, email, whatsapp, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, active, is_admin, can_send_messages FROM professores WHERE active = TRUE ORDER BY nome');
    res.json(result.rows);
});

app.post('/api/professores', async (req, res) => {
    const { nome, email, whatsapp, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha, can_send_messages } = req.body;
    
    let passwordHash = null;
    if (senha) {
        passwordHash = await bcrypt.hash(senha, 10);
    }

    try {
        await db.query(
            'INSERT INTO professores (nome, email, whatsapp, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha, can_send_messages) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', 
            [nome, email, whatsapp || null, data_nascimento, pix || null, cpf || null, contato || null, endereco || null, dados_bancarios || null, passwordHash, can_send_messages || false]
        );
        res.status(201).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar professor' });
    }
});

app.put('/api/professores/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, whatsapp, data_nascimento, pix, cpf, contato, endereco, dados_bancarios, senha, active, can_send_messages } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); values.push(whatsapp); }
    if (data_nascimento !== undefined) { fields.push(`data_nascimento = $${idx++}`); values.push(data_nascimento); }
    if (pix !== undefined) { fields.push(`pix = $${idx++}`); values.push(pix); }
    if (cpf !== undefined) { fields.push(`cpf = $${idx++}`); values.push(cpf); }
    if (contato !== undefined) { fields.push(`contato = $${idx++}`); values.push(contato); }
    if (endereco !== undefined) { fields.push(`endereco = $${idx++}`); values.push(endereco); }
    if (dados_bancarios !== undefined) { fields.push(`dados_bancarios = $${idx++}`); values.push(dados_bancarios); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
    if (can_send_messages !== undefined) { fields.push(`can_send_messages = $${idx++}`); values.push(can_send_messages); }

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
app.get('/api/clientes', authenticateToken, async (req, res) => {
    const professorId = req.user.id;
    const isAdmin = req.user.is_admin;
    
    // Admin: Vê TODOS os clientes.
    // Professor: Vê apenas os seus.
    
    let query;
    let params;
    
    if (isAdmin) {
        query = `
            SELECT c.*, 
                COALESCE(SUM(m.valor_mensalidade), 0) as total_valor,
                STRING_AGG(DISTINCT cu.nome, ', ') as cursos_nomes
            FROM clientes c
            LEFT JOIN matriculas m ON c.id = m.cliente_id AND m.active = TRUE
            LEFT JOIN cursos cu ON m.curso_id = cu.id
            GROUP BY c.id
            ORDER BY c.nome ASC
        `;
        params = [];
    } else {
        query = `
            SELECT c.*, 
                COALESCE(SUM(m.valor_mensalidade), 0) as total_valor,
                STRING_AGG(DISTINCT cu.nome, ', ') as cursos_nomes
            FROM clientes c
            JOIN matriculas m ON c.id = m.cliente_id AND m.active = TRUE AND m.professor_id = $1
            LEFT JOIN cursos cu ON m.curso_id = cu.id
            GROUP BY c.id
            ORDER BY c.nome ASC
        `;
        params = [professorId];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
});

app.post('/api/clientes', authenticateToken, async (req, res) => {
    // Ao criar cliente, podemos permitir. Mas a query de listagem acima exige matrícula.
    // Se o frontend criar apenas o cliente sem matrícula, ele não aparecerá na lista.
    // Isso é um risco.
    // Solução: O frontend atual (modal) já pede dados de matrícula/curso na criação do cliente?
    // Sim, "frontend-react/src/components/clients/ClientForm.tsx" envia 'professor_id', 'curso_id' etc.
    // Então a query de INSERT já cria a primeira relação?
    // Verificando o endpoint original POST /api/clientes:
    // Ele faz INSERT na tabela clientes. E os dados extras?
    // O server.js antigo (linha 253 original) recebia professor_id, curso_id... mas só fazia insert em Clientes?
    // Espera, a tabela Clientes tinha `professor_id`?
    // Sim! `professor_id` na tabela clientes foi legado ou é usado como "Dono"?
    // Se a tabela clientes tem `professor_id`, então podemos filtrar por ele também!
    // Verificar schema: Clientes tem `professor_id` (User info XML diz que sim na migration antiga ou server.js inserts).
    // Linha 256 original: INSERT INTO clientes (..., professor_id, ...)
    // Ótimo! Então usamos esse campo como vinculo primário.
    
    const { nome, endereco, whatsapp, valor_padrao, dia_vencimento, curso_id, valor_professor, valor_igreja } = req.body;
    const professorId = req.user.id; // Força o professor logado
    
    try {
        const result = await db.query(
            'INSERT INTO clientes (nome, endereco, whatsapp, valor_padrao, dia_vencimento, professor_id, curso_id, valor_professor, valor_igreja) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [nome, endereco, whatsapp, valor_padrao, dia_vencimento, professorId, curso_id, valor_professor || valor_padrao, valor_igreja || 0]
        );
        
        // Se o cliente foi criado com um curso_id, deveríamos criar uma matrícula automaticamente?
        // O código antigo não criava matrícula explícita aqui, mas tinha 'curso_id' no cliente.
        // A lógica de "matriculas" foi adicionada depois (Fase 6).
        // Se o sistema migrou para tabela `matriculas`, o `curso_id` em clientes é legado?
        // Vamos checar `api/matriculas` POST.
        
        // CORREÇÃO IMEDIATA: Precisamos criar a matrícula, senão o aluno não aparece na lista (JOIN matriculas).
        // Se o body tem curso_id, criamos a matrícula.
        if (curso_id) {
             await db.query(`
                INSERT INTO matriculas (
                    cliente_id, curso_id, professor_id, 
                    dia_vencimento, valor_mensalidade, 
                    valor_professor, valor_igreja, active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            `, [result.rows[0].id, curso_id, professorId, dia_vencimento, valor_padrao, valor_professor || valor_padrao, valor_igreja || 0]);
        }
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar' });
    }
});

// Update Client (Edit or Deactivate)
app.put('/api/clientes/:id', authenticateToken, async (req, res) => {
    // ... manter lógica, talvez validar se pertence ao professor?
    // Por enquanto, auth simples.
    // ...
    const { id } = req.params;
    const { nome, endereco, whatsapp, valor_padrao, dia_vencimento, curso_id, active, valor_professor, valor_igreja } = req.body;
    // professor_id ignorado do body, usamos do token se fosse update, mas aqui é só update de dados cadastrais.

    // Dynamic Query Construction
    const fields = [];
    const values = [];
    let idx = 1;

    if (nome !== undefined) { fields.push(`nome = $${idx++}`); values.push(nome); }
    if (endereco !== undefined) { fields.push(`endereco = $${idx++}`); values.push(endereco); }
    if (whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); values.push(whatsapp); }
    if (valor_padrao !== undefined) { fields.push(`valor_padrao = $${idx++}`); values.push(valor_padrao); }
    if (dia_vencimento !== undefined) { fields.push(`dia_vencimento = $${idx++}`); values.push(dia_vencimento); }
    // professor_id não atualiza
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
app.patch('/api/clientes/:id/toggle-active', authenticateToken, async (req, res) => {
    // ...
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
app.delete('/api/clientes/:id', authenticateToken, async (req, res) => {
    // ...
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
app.get('/api/cobranca', authenticateToken, async (req, res) => {
    try {
        const mes = req.query.mes || new Date().toISOString().slice(0, 7); // "2024-01"
        const professorId = req.user.id;
        const isAdmin = req.user.is_admin;

        // 1. First, ensure payments exist for all active MATRICULAS for this month
        // "Lazy Generation" strategy: check and create if missing
        
        if (isAdmin) {
             // Admin generates for ALL matriculas?
             // Or we just skip generation for Admin view to save performance?
             // Ideally generation happens when viewing. Let's run for ALL if admin (cautions on performance).
             // Optimized: Generate for ALL active matriculas that don't have payment.
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
                    CASE 
                        WHEN COALESCE(m.valor_mensalidade, 0) = 0 THEN 'ISENTO'
                        ELSE 'PENDENTE'
                    END,
                    COALESCE(m.valor_professor, 0), 
                    COALESCE(m.valor_igreja, 0)
                FROM matriculas m
                JOIN clientes c ON m.cliente_id = c.id
                WHERE m.active = TRUE 
                AND c.active = TRUE
                AND NOT EXISTS (
                    SELECT 1 FROM pagamentos p
                    WHERE p.matricula_id = m.id 
                    AND p.mes_ref = $1::varchar
                )
            `, [mes]);

        } else {
            // Professor generates for HIS matriculas
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
                    CASE 
                        WHEN COALESCE(m.valor_mensalidade, 0) = 0 THEN 'ISENTO'
                        ELSE 'PENDENTE'
                    END,
                    COALESCE(m.valor_professor, 0), 
                    COALESCE(m.valor_igreja, 0)
                FROM matriculas m
                JOIN clientes c ON m.cliente_id = c.id
                WHERE m.active = TRUE 
                AND c.active = TRUE
                AND m.professor_id = $2
                AND NOT EXISTS (
                    SELECT 1 FROM pagamentos p
                    WHERE p.matricula_id = m.id 
                    AND p.mes_ref = $1::varchar
                )
            `, [mes, professorId]);
        }

        // 2. Fetch the payments with details (updated for Matriculas)
        const filter = isAdmin ? "" : "AND pg.professor_id = $2";
        const params = isAdmin ? [mes] : [mes, professorId];

        const query = `
            SELECT 
                pg.id,
                pg.matricula_id,
                pg.cliente_id,
                pg.professor_id,
                pg.curso_id,
                pg.mes_ref,
                pg.valor_cobrado,
                pg.valor_professor_recebido,
                pg.valor_igreja_recebido,
                pg.data_pagamento,
                pg.data_vencimento,
                CASE 
                    WHEN pg.valor_cobrado = 0 THEN 'ISENTO'
                    WHEN pg.data_pagamento IS NOT NULL THEN 'PAGO'
                    WHEN pg.data_vencimento < CURRENT_DATE THEN 'ATRASADO'
                    ELSE 'PENDENTE'
                END as status,
                c.nome, 
                curr.nome as nome_curso,
                c.whatsapp, 
                prof.nome as nome_professor
            FROM pagamentos pg
            JOIN clientes c ON pg.cliente_id = c.id
            LEFT JOIN matriculas m ON pg.matricula_id = m.id
            LEFT JOIN cursos curr ON pg.curso_id = curr.id
            LEFT JOIN professores prof ON pg.professor_id = prof.id
            WHERE pg.mes_ref = $1 ${filter}
            ORDER BY UPPER(c.nome) ASC
        `;

        const result = await db.query(query, params);
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
app.get('/api/matriculas/:cliente_id', authenticateToken, async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const professorId = req.user.id;
        const isAdmin = req.user.is_admin;
        
        let query;
        let params;
        
        if (isAdmin) {
             query = `
                SELECT m.*, c.nome as nome_curso, p.nome as nome_professor
                FROM matriculas m
                LEFT JOIN cursos c ON m.curso_id = c.id
                LEFT JOIN professores p ON m.professor_id = p.id
                WHERE m.cliente_id = $1 AND m.active = TRUE
                ORDER BY m.id ASC
            `;
            params = [cliente_id];
        } else {
             query = `
                SELECT m.*, c.nome as nome_curso, p.nome as nome_professor
                FROM matriculas m
                LEFT JOIN cursos c ON m.curso_id = c.id
                LEFT JOIN professores p ON m.professor_id = p.id
                WHERE m.cliente_id = $1 AND m.active = TRUE AND m.professor_id = $2
                ORDER BY m.id ASC
            `;
            params = [cliente_id, professorId];
        }
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar matrículas' });
    }
});

// Create new matricula
app.post('/api/matriculas', authenticateToken, async (req, res) => {
    try {
        const { 
            cliente_id, curso_id, 
            dia_vencimento, valor_mensalidade, 
            valor_professor, valor_igreja 
        } = req.body;
        
        const professor_id = req.user.id; // Enforce logged user

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
app.put('/api/matriculas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const isAdmin = req.user.is_admin;
        const { 
            professor_id,
            curso_id, 
            dia_vencimento, 
            valor_mensalidade, 
            valor_professor, 
            valor_igreja 
        } = req.body;

        // Admin can update any enrollment, professor can only update their own
        const ownershipCheck = isAdmin ? '' : 'AND professor_id = $8';
        const params = isAdmin 
            ? [professor_id, curso_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, id]
            : [professor_id, curso_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, id, currentUserId];

        const result = await db.query(`
            UPDATE matriculas SET
                professor_id = COALESCE($1, professor_id),
                curso_id = COALESCE($2, curso_id),
                dia_vencimento = COALESCE($3, dia_vencimento),
                valor_mensalidade = COALESCE($4, valor_mensalidade),
                valor_professor = COALESCE($5, valor_professor),
                valor_igreja = COALESCE($6, valor_igreja)
            WHERE id = $7 ${ownershipCheck}
            RETURNING *
        `, params);

        if (result.rowCount === 0) return res.status(404).send('Matrícula não encontrada ou sem permissão');
        
        const updatedMatricula = result.rows[0];
        
        // Sync pending payments when professor changes
        // This ensures that pending/future payments reflect the correct professor
        if (professor_id) {
            await db.query(`
                UPDATE pagamentos 
                SET professor_id = $1
                WHERE matricula_id = $2 
                AND status IN ('PENDENTE', 'ATRASADO')
            `, [professor_id, id]);
            
            console.log(`Synced pending payments for matricula ${id} to professor ${professor_id}`);
        }
        
        res.json(updatedMatricula);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar matrícula' });
    }
});

// Delete matricula (Soft Delete)
app.delete('/api/matriculas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const professorId = req.user.id;
        
        const result = await db.query('UPDATE matriculas SET active = FALSE WHERE id = $1 AND professor_id = $2 RETURNING *', [id, professorId]);
        
        if (result.rowCount === 0) return res.status(404).send('Matrícula não encontrada ou sem permissão');

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

// --- REPORTS ENDPOINTS ---

// Get professor reports (Admin only)
app.get('/api/relatorios/professores', authenticateToken, async (req, res) => {
    try {
        // Admin only
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        }

        const mes = req.query.mes || new Date().toISOString().slice(0, 7);

        // Get all professors with their statistics
        const result = await db.query(`
            SELECT 
                p.id,
                p.nome,
                p.email,
                p.pix,
                -- Active students count
                COALESCE((
                    SELECT COUNT(DISTINCT m.cliente_id) 
                    FROM matriculas m 
                    JOIN clientes c ON m.cliente_id = c.id
                    WHERE m.professor_id = p.id 
                    AND m.active = true 
                    AND c.active = true
                ), 0) as alunos_ativos,
                -- Inactive students count (students that were with this professor but are now inactive)
                COALESCE((
                    SELECT COUNT(DISTINCT m.cliente_id) 
                    FROM matriculas m 
                    JOIN clientes c ON m.cliente_id = c.id
                    WHERE m.professor_id = p.id 
                    AND (m.active = false OR c.active = false)
                ), 0) as alunos_inativos,
                -- Total expected for the month
                COALESCE((
                    SELECT SUM(pg.valor_cobrado) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1
                ), 0) as total_mes,
                -- Total paid
                COALESCE((
                    SELECT SUM(pg.valor_cobrado) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PAGO'
                ), 0) as total_pago,
                -- Total pending
                COALESCE((
                    SELECT SUM(pg.valor_cobrado) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PENDENTE'
                ), 0) as total_pendente,
                -- Total delayed
                COALESCE((
                    SELECT SUM(pg.valor_cobrado) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'ATRASADO'
                ), 0) as total_atrasado,
                -- Delayed count
                COALESCE((
                    SELECT COUNT(*) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'ATRASADO'
                ), 0) as qtd_atrasados,
                -- Professor earnings (from paid)
                COALESCE((
                    SELECT SUM(pg.valor_professor_recebido) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PAGO'
                ), 0) as professor_recebido,
                -- Professor expected total
                COALESCE((
                    SELECT SUM(pg.valor_professor_recebido) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1
                ), 0) as professor_total,
                -- Church repasse (from paid)
                COALESCE((
                    SELECT SUM(pg.valor_igreja_recebido) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PAGO'
                ), 0) as igreja_recebido,
                -- Church expected total
                COALESCE((
                    SELECT SUM(pg.valor_igreja_recebido) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1
                ), 0) as igreja_total,
                -- Paid count
                COALESCE((
                    SELECT COUNT(*) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PAGO'
                ), 0) as qtd_pagos,
                -- Pending count
                COALESCE((
                    SELECT COUNT(*) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1 
                    AND pg.status = 'PENDENTE'
                ), 0) as qtd_pendentes,
                -- Total payments count
                COALESCE((
                    SELECT COUNT(*) 
                    FROM pagamentos pg 
                    WHERE pg.professor_id = p.id 
                    AND pg.mes_ref = $1
                ), 0) as total_cobrancas
            FROM professores p
            WHERE p.active = true
            ORDER BY p.nome
        `, [mes]);

        // Get global totals for unique students
        const totalsResult = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM clientes WHERE active = true) as total_alunos_ativos,
                (SELECT COUNT(*) FROM clientes WHERE active = false) as total_alunos_inativos,
                COALESCE((SELECT SUM(valor_cobrado) FROM pagamentos WHERE mes_ref = $1), 0) as total_mes,
                COALESCE((SELECT SUM(valor_cobrado) FROM pagamentos WHERE mes_ref = $1 AND status = 'PAGO'), 0) as total_pago,
                COALESCE((SELECT SUM(valor_cobrado) FROM pagamentos WHERE mes_ref = $1 AND status IN ('PENDENTE', 'ATRASADO')), 0) as total_pendente,
                COALESCE((SELECT SUM(valor_igreja_recebido) FROM pagamentos WHERE mes_ref = $1 AND status = 'PAGO'), 0) as igreja_recebido
        `, [mes]);

        res.json({
            totals: totalsResult.rows[0],
            professors: result.rows
        });
    } catch (err) {
        console.error('Erro ao buscar relatório de professores:', err);
        res.status(500).json({ error: 'Erro ao buscar relatório' });
    }
});
