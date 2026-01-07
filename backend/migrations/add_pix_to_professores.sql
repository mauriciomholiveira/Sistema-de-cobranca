-- Add PIX column to professores table
ALTER TABLE professores 
ADD COLUMN IF NOT EXISTS pix VARCHAR(255);

-- Add comment
COMMENT ON COLUMN professores.pix IS 'Chave PIX do professor para recebimento de pagamentos';
