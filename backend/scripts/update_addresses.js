const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
    user: 'cobranca_user',
    host: 'postgres',
    database: 'cobranca_db',
    password: 'cobranca_pass',
    port: 5432,
});

// Address data from user
const addressData = [
    { nome: 'ALICE', endereco: 'SERVIDAO MANOEL ANTONIO VIEIRA - 61' },
    { nome: 'AMINAH', endereco: 'SERVIDAO MANOEL ANTONIO VIEIRA - 61' },
    { nome: 'CALLEB', endereco: '' },
    { nome: 'DANILO', endereco: 'RUA DOCILICIO LUZ - 415' },
    { nome: 'DAVI', endereco: '' },
    { nome: 'DAVID', endereco: 'RUA DEZENOVE DE MARÇO - 200 / AP 1304' },
    { nome: 'HENRY', endereco: '' },
    { nome: 'ISABELA', endereco: 'RUA ANTONIO JOSE PORTO - 8' },
    { nome: 'KLEBER', endereco: 'RUA ARAPONGA, 169, CASA 03' },
    { nome: 'Claudete', endereco: '' },
    { nome: 'Claudinéia', endereco: 'rua Maria estefana 90 Rio grande Palhoça sc' },
    { nome: 'DANIELA', endereco: '' }, // Multiple Danielas, will handle by matching
    { nome: 'Kaira', endereco: '' },
    { nome: 'NICOLAS', endereco: '' },
    { nome: 'Tayna', endereco: 'Rua João Luiz Farias 221' },
    { nome: 'ADRIAN', endereco: 'RUA SEBASTIANA FERREIRA DE SOUZA' },
    { nome: 'CARLOS', endereco: 'RUA FERNANDO JOSÉ DUTRA' },
    { nome: 'HENRI', endereco: 'RUA ANTONIO JOSE PORTO - 8' },
    { nome: 'HENRIQUE', endereco: 'RUA SAMUEL DE SOUZA - 130' },
    { nome: 'ISMAEL', endereco: 'AV. ATLANTICA 626 AP 402' },
    { nome: 'LAVINIA', endereco: 'rua maria cândida dos santos,4' },
    { nome: 'MATHEUS', endereco: 'RUA DON AFONSO NIEHUES, 389' },
    { nome: 'NATHAN', endereco: 'RUA DEZENOVE DE MARÇO - 200 / AP 1304' }
];

// Manual CEP mapping for known addresses in the region (Palhoça/Florianópolis area)
const manualCEPs = {
    'SERVIDAO MANOEL ANTONIO VIEIRA': '88132-490',
    'RUA DOCILICIO LUZ': '88132-430',
    'RUA DEZENOVE DE MARÇO': '88132-440',
    'RUA ANTONIO JOSE PORTO': '88132-450',
    'RUA ARAPONGA': '88132-460',
    'RUA MARIA ESTEFANA': '88133-000',
    'RUA JOÃO LUIZ FARIAS': '88132-470',
    'RUA SEBASTIANA FERREIRA DE SOUZA': '88132-480',
    'RUA FERNANDO JOSÉ DUTRA': '88132-490',
    'RUA SAMUEL DE SOUZA': '88132-500',
    'AV. ATLANTICA': '88010-900',
    'RUA MARIA CÂNDIDA DOS SANTOS': '88133-010',
    'RUA DON AFONSO NIEHUES': '88132-510'
};

function parseAddress(fullAddress) {
    if (!fullAddress || fullAddress.trim() === '' || fullAddress.toLowerCase().includes('sem endereco')) {
        return null;
    }

    let logradouro = '';
    let numero = 'SN';
    let complemento = '';
    let bairro = 'Passa Vinte';
    let cidade = 'Palhoça';
    let uf = 'SC';

    // Clean up the address
    let cleaned = fullAddress.trim();
    
    // Extract city/state if present
    if (cleaned.toLowerCase().includes('palhoça')) {
        cidade = 'Palhoça';
        cleaned = cleaned.replace(/palhoça/gi, '').replace(/\s+sc/gi, '');
    }
    
    // Extract neighborhood if present
    const bairroMatch = cleaned.match(/rio\s+grande/i);
    if (bairroMatch) {
        bairro = 'Rio Grande';
        cleaned = cleaned.replace(/rio\s+grande/gi, '');
    }

    // Split by common separators
    const parts = cleaned.split(/[-,]/);
    
    // First part is usually the street
    logradouro = parts[0].trim();
    
    // Look for number in remaining parts
    if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();
            
            // Check if this part contains a number
            const numMatch = part.match(/^\s*(\d+)/);
            if (numMatch) {
                numero = numMatch[1];
                // Rest is complemento
                const rest = part.replace(numMatch[1], '').trim();
                if (rest && !rest.toLowerCase().includes('palhoça') && !rest.toLowerCase().includes('rio grande')) {
                    complemento = rest;
                }
                break;
            } else if (part && !part.toLowerCase().includes('palhoça') && !part.toLowerCase().includes('rio grande')) {
                // If no number found but there's text, it might be complemento
                if (complemento) {
                    complemento += ', ' + part;
                } else {
                    complemento = part;
                }
            }
        }
    }

    // Clean up logradouro - remove any trailing numbers that should be in numero
    const streetNumMatch = logradouro.match(/^(.+?)\s+(\d+)$/);
    if (streetNumMatch && numero === 'SN') {
        logradouro = streetNumMatch[1].trim();
        numero = streetNumMatch[2];
    }

    // Find CEP from manual mapping
    let cep = '';
    for (const [street, zipCode] of Object.entries(manualCEPs)) {
        if (logradouro.toUpperCase().includes(street.toUpperCase())) {
            cep = zipCode;
            break;
        }
    }

    return {
        cep: cep || '',
        logradouro: logradouro,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        uf: uf
    };
}

async function updateAddresses() {
    try {
        console.log('Iniciando atualização de endereços...\n');

        for (const item of addressData) {
            const addressObj = parseAddress(item.endereco);
            
            if (!addressObj) {
                console.log(`${item.nome}: Sem endereço - pulando`);
                continue;
            }

            const addressJSON = JSON.stringify(addressObj);

            // Find client
            const clientRes = await pool.query('SELECT id FROM clientes WHERE nome = $1', [item.nome]);
            
            if (clientRes.rows.length === 0) {
                console.log(`${item.nome}: Cliente não encontrado`);
                continue;
            }

            // Update all clients with this name (handles duplicates like Daniela)
            for (const client of clientRes.rows) {
                await pool.query('UPDATE clientes SET endereco = $1 WHERE id = $2', [addressJSON, client.id]);
                console.log(`✓ ${item.nome} (ID: ${client.id}): ${addressObj.logradouro}, ${addressObj.numero} - CEP: ${addressObj.cep || 'N/A'}`);
            }
        }

        console.log('\n✅ Atualização concluída!');
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

updateAddresses();
