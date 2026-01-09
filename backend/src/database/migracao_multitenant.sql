-- Migration Multi-tenant
BEGIN;

-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert Default Tenant (for existing data migration)
INSERT INTO tenants (name) 
SELECT 'Matriz' 
WHERE NOT EXISTS (SELECT 1 FROM tenants);

-- Capture the Default Tenant ID into a temporary variable or subquery logic
-- We'll use a subquery to get it dynamically

-- 3. Update Existing Tables
-- Function to safely add tenant_id
CREATE OR REPLACE FUNCTION add_tenant_column(tbl_name text) RETURNS void AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT %L REFERENCES tenants(id)', tbl_name, default_tenant_id);
    
    -- Update existing rows to belong to default tenant (if null)
    EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', tbl_name, default_tenant_id);

    -- Enforce NOT NULL after update
    EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', tbl_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
SELECT add_tenant_column('professores');
SELECT add_tenant_column('cursos');
SELECT add_tenant_column('clientes');
SELECT add_tenant_column('matriculas');
SELECT add_tenant_column('pagamentos');

-- Templates might be shared or per-tenant. Let's make them per-tenant for customization.
SELECT add_tenant_column('templates_mensagem');


-- 4. Create Users Table (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER', -- 'OWNER', 'ADMIN', 'VIEWER'
    permissions JSONB DEFAULT '[]', -- ['dashboard', 'billing', 'clients', 'management']
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert Default Admin User
-- Password: 'admin' (hashed: $2a$10$X7...) - You should implement bcrypt hash generation in JS, here currently placeholder or you can put a known hash
-- Let's put a placeholder. The app will need a script to create the first user properly if we want a safe password.
-- For now, we insert 'admin' / '123456' (Needs update)
-- INSERT INTO users (username, password_hash, role, permissions, tenant_id)
-- SELECT 'admin', '$2a$10$EpIsdjj.xA..', 'OWNER', '["all"]', id FROM tenants LIMIT 1;

COMMIT;
