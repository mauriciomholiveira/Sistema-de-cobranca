-- 1. Create table matriculas
CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    curso_id INTEGER REFERENCES cursos(id),
    professor_id INTEGER REFERENCES professores(id),
    dia_vencimento INTEGER DEFAULT 10,
    valor_mensalidade NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_professor NUMERIC(10,2),
    valor_igreja NUMERIC(10,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate data from clientes to matriculas
INSERT INTO matriculas (cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active)
SELECT id, curso_id, professor_id, dia_vencimento, valor_padrao, valor_professor, valor_igreja, active
FROM clientes
WHERE active = TRUE OR active = FALSE;

-- 3. Add Columns to Pagamentos to track origin
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS matricula_id INTEGER REFERENCES matriculas(id) ON DELETE SET NULL;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS professor_id INTEGER REFERENCES professores(id);
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS curso_id INTEGER REFERENCES cursos(id);

-- 4. Update existing payments to link to the new matricula
-- This assumes 1 client = 1 matricula (which is true right now)
UPDATE pagamentos p
SET 
    matricula_id = m.id,
    professor_id = m.professor_id,
    curso_id = m.curso_id
FROM matriculas m
WHERE p.cliente_id = m.cliente_id;
