-- Adicionar vinculo com Professor na tabela de usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS professor_id INTEGER REFERENCES professores(id);
-- Permite que usuário seja do tipo PROFESSOR
-- A validação da Role é feita na aplicação, mas o campo já existe.
