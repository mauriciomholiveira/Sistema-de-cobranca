const db = require('./src/database/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        await db.query(`
            ALTER TABLE professores 
            ADD COLUMN IF NOT EXISTS can_send_messages BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration successful: Added can_send_messages column.');
        
        // Optional: Set existing admins to TRUE (or all to FALSE as default is safe)
        // Let's set Admins to TRUE by default so they don't lock themselves out (though admins usually bypass this check in frontend, good to be consistent)
        await db.query(`UPDATE professores SET can_send_messages = TRUE WHERE is_admin = TRUE`);
        console.log('Updated admins to have can_send_messages = TRUE');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
