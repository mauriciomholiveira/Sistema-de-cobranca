-- Add revenue split columns to clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS valor_professor DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_igreja DECIMAL(10,2);

-- Add revenue tracking to pagamentos_mensais
ALTER TABLE pagamentos_mensais 
ADD COLUMN IF NOT EXISTS valor_professor_recebido DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_igreja_recebido DECIMAL(10,2);

-- Update existing records with default split (professor gets all, igreja gets 0)
UPDATE clientes 
SET valor_professor = valor_padrao, 
    valor_igreja = 0 
WHERE valor_professor IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN clientes.valor_professor IS 'Valor que o professor recebe por aluno';
COMMENT ON COLUMN clientes.valor_igreja IS 'Valor que fica para a igreja por aluno';
COMMENT ON COLUMN pagamentos_mensais.valor_professor_recebido IS 'Valor recebido pelo professor neste mês';
COMMENT ON COLUMN pagamentos_mensais.valor_igreja_recebido IS 'Valor recebido pela igreja neste mês';
