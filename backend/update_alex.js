
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
    try {
        const hash = await bcrypt.hash('123456', 10);
        // Find Professor Alex
        const res = await pool.query("SELECT id, nome FROM professores WHERE nome ILIKE '%Alex%'");
        if (res.rows.length > 0) {
            const id = res.rows[0].id;
            console.log(`Found Professor: ${res.rows[0].nome} (ID: ${id})`);
            
            // Update password and ensure permissions are RESTRICTED
            await pool.query('UPDATE professores SET senha = $1, is_admin = FALSE, can_send_messages = FALSE WHERE id = $2', [hash, id]);
            console.log('Updated Professor Alex: Password=123456, Admin=FALSE, CanSend=FALSE');
        } else {
            console.log('Professor Alex not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
