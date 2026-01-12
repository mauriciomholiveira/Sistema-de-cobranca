const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function resetPassword() {
  const email = 'alex@email.com'; // Using Alex as test user
  const newPassword = '123'; 
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    // Ensure user exists first
    const check = await pool.query('SELECT * FROM professores WHERE nome ILIKE $1', ['%Alex%']);
    if (check.rows.length === 0) {
        console.log('User Alex not found, trying Abner...');
         const checkAbner = await pool.query('SELECT * FROM professores WHERE nome ILIKE $1', ['%Abner%']);
         if (checkAbner.rows.length > 0) {
            const id = checkAbner.rows[0].id;
             await pool.query('UPDATE professores SET email = $1, senha = $2, active = TRUE WHERE id = $3', ['abner@email.com', hashedPassword, id]);
             console.log(`Password reset for Abner (abner@email.com) to ${newPassword}`);
             return;
         }
         console.error('No suitable user found.');
         return;
    }

    const id = check.rows[0].id;
    await pool.query('UPDATE professores SET email = $1, senha = $2, active = TRUE WHERE id = $3', [email, hashedPassword, id]);
    console.log(`Password reset for Alex (${email}) to ${newPassword}`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

resetPassword();
