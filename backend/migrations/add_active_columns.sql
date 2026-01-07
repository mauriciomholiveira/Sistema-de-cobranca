-- Add active column to professores
ALTER TABLE professores ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Add active column to cursos  
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Add pix column to professores (if not exists from previous migration)
ALTER TABLE professores ADD COLUMN IF NOT EXISTS pix VARCHAR(255);

-- Update all existing records to be active
UPDATE professores SET active = TRUE WHERE active IS NULL;
UPDATE cursos SET active = TRUE WHERE active IS NULL;
