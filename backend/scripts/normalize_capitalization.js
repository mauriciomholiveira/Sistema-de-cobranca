const { Pool } = require('pg');

const pool = new Pool({
    user: 'cobranca_user',
    host: 'postgres',
    database: 'cobranca_db',
    password: 'cobranca_pass',
    port: 5432,
});

// Words that should remain lowercase in addresses (prepositions, articles)
const lowercaseWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os'];

function toTitleCase(str) {
    if (!str) return str;
    
    return str
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            // Keep prepositions lowercase unless they're the first word
            if (index > 0 && lowercaseWords.includes(word)) {
                return word;
            }
            // Capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

function normalizeAddress(addressJSON) {
    if (!addressJSON) return addressJSON;
    
    try {
        const addr = typeof addressJSON === 'string' ? JSON.parse(addressJSON) : addressJSON;
        
        return JSON.stringify({
            cep: addr.cep || '',
            logradouro: toTitleCase(addr.logradouro || ''),
            numero: addr.numero || '',
            complemento: toTitleCase(addr.complemento || ''),
            bairro: toTitleCase(addr.bairro || ''),
            cidade: toTitleCase(addr.cidade || ''),
            uf: (addr.uf || '').toUpperCase()
        });
    } catch (e) {
        console.error('Error parsing address:', e);
        return addressJSON;
    }
}

async function normalizeData() {
    try {
        console.log('🔄 Iniciando normalização de dados...\n');

        // 1. Normalize client names and addresses
        const clients = await pool.query('SELECT id, nome, endereco FROM clientes');
        
        console.log(`📋 Normalizando ${clients.rows.length} clientes...\n`);
        
        for (const client of clients.rows) {
            const normalizedName = toTitleCase(client.nome);
            const normalizedAddress = normalizeAddress(client.endereco);
            
            await pool.query(
                'UPDATE clientes SET nome = $1, endereco = $2 WHERE id = $3',
                [normalizedName, normalizedAddress, client.id]
            );
            
            console.log(`✓ ${client.nome} → ${normalizedName}`);
        }

        console.log('\n📋 Normalizando professores...\n');

        // 2. Normalize professor names
        const professors = await pool.query('SELECT id, nome FROM professores WHERE NOT is_admin');
        
        for (const prof of professors.rows) {
            const normalizedName = toTitleCase(prof.nome);
            
            await pool.query(
                'UPDATE professores SET nome = $1 WHERE id = $2',
                [normalizedName, prof.id]
            );
            
            console.log(`✓ ${prof.nome} → ${normalizedName}`);
        }

        console.log('\n📋 Normalizando cursos...\n');

        // 3. Normalize course names
        const courses = await pool.query('SELECT id, nome FROM cursos');
        
        for (const course of courses.rows) {
            const normalizedName = toTitleCase(course.nome);
            
            await pool.query(
                'UPDATE cursos SET nome = $1 WHERE id = $2',
                [normalizedName, course.id]
            );
            
            console.log(`✓ ${course.nome} → ${normalizedName}`);
        }

        console.log('\n✅ Normalização concluída com sucesso!');
        console.log('📊 Todos os nomes e endereços agora seguem o padrão Title Case.');
        
    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

normalizeData();
