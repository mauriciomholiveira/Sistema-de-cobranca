-- Adicionar novos campos para cadastro completo de usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Adicionar campo para permissões granulares de menu
-- Armazena um array JSON de strings, ex: ['dashboard', 'clientes', 'cobranca']
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
