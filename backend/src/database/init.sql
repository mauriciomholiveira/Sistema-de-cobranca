-- Tabelas Auxiliares
CREATE TABLE IF NOT EXISTS professores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    whatsapp VARCHAR(20),
    cpf VARCHAR(20),
    pix VARCHAR(255),
    data_nascimento DATE,
    contato VARCHAR(100),
    endereco TEXT,
    dados_bancarios TEXT,
    active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    can_send_messages BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    mensalidade_padrao DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates_mensagem (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    conteudo TEXT NOT NULL
);

-- Tabela Principal de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    whatsapp VARCHAR(20) NOT NULL,
    dia_vencimento INTEGER DEFAULT 10,
    valor_padrao DECIMAL(10, 2) DEFAULT 0.00,
    -- Campos legados que ainda são preenchidos no insert
    professor_id INTEGER REFERENCES professores(id),
    curso_id INTEGER REFERENCES cursos(id),
    valor_professor DECIMAL(10, 2) DEFAULT 0.00,
    valor_igreja DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Matrículas (Vínculo Cliente-Curso-Professor)
CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    curso_id INTEGER REFERENCES cursos(id),
    professor_id INTEGER REFERENCES professores(id),
    dia_vencimento INTEGER,
    valor_mensalidade DECIMAL(10, 2),
    valor_professor DECIMAL(10, 2),
    valor_igreja DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pagamentos (Financeiro)
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    matricula_id INTEGER REFERENCES matriculas(id),
    cliente_id INTEGER REFERENCES clientes(id),
    professor_id INTEGER REFERENCES professores(id),
    curso_id INTEGER REFERENCES cursos(id),
    mes_ref VARCHAR(7) NOT NULL, -- Ex: "2024-01"
    
    valor_cobrado DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO, ISENTO
    data_pagamento DATE,
    
    valor_professor_recebido DECIMAL(10, 2) DEFAULT 0,
    valor_igreja_recebido DECIMAL(10, 2) DEFAULT 0,
    
    -- Controle de Mensagens
    msg_lembrete_enviada BOOLEAN DEFAULT FALSE,
    msg_vencimento_enviada BOOLEAN DEFAULT FALSE,
    msg_atraso_enviada BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pagamentos_cliente ON pagamentos(cliente_id);
CREATE INDEX idx_pagamentos_mes ON pagamentos(mes_ref);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_prof ON pagamentos(professor_id);

-- Seed Inicial
INSERT INTO templates_mensagem (titulo, conteudo) VALUES 
('Cobrança Padrão', 'Olá {nome}, tudo bem? Passando para lembrar da sua mensalidade referente a {mes} no valor de R$ {valor}.'),
('Em Atraso', 'Olá {nome}. Consta em nosso sistema uma pendência referente a {mes}. Valor atualizado: R$ {valor}. Podemos regularizar?');

-- Admin Padrão
-- Senha '123456' hashada (exemplo aproximado ou texto plano se o sistema suportar)
-- O sistema suporta texto plano se não começar com $2. Vamos usar texto plano '123456' para facilitar ou você pode usar o hash
INSERT INTO professores (nome, email, senha, is_admin, active) VALUES 
('Administrador', 'admin@sistema.com', '123456', TRUE, TRUE);
