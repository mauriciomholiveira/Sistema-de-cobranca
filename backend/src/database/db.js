const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'cobranca_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'cobranca_db',
    password: process.env.POSTGRES_PASSWORD || 'cobranca_pass',
    port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
