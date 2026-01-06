-- Tabelas Auxiliares
CREATE TABLE IF NOT EXISTS professores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    mensalidade_padrao DECIMAL(10, 2), -- Sugestão de valor para novos alunos
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
    dia_vencimento INTEGER NOT NULL DEFAULT 10,
    valor_padrao DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    professor_id INTEGER REFERENCES professores(id),
    curso_id INTEGER REFERENCES cursos(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pagamentos (Financeiro)
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    mes_ref VARCHAR(7) NOT NULL, -- Ex: "2024-01"
    valor_cobrado DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO
    data_pagamento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, mes_ref) -- Um pagamento por mês por cliente
);

-- Indexes
CREATE INDEX idx_pagamentos_cliente ON pagamentos(cliente_id);
CREATE INDEX idx_pagamentos_mes ON pagamentos(mes_ref);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);

-- Seed Inicial (Dados de Exemplo)
INSERT INTO templates_mensagem (titulo, conteudo) VALUES 
('Cobrança Padrão', 'Olá {nome}, tudo bem? Passando para lembrar da sua mensalidade referente a {mes} no valor de R$ {valor}.'),
('Em Atraso', 'Olá {nome}. Consta em nosso sistema uma pendência referente a {mes}. Valor atualizado: R$ {valor}. Podemos regularizar?');
