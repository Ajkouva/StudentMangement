const pool = require('./db');
const bcrypt = require('bcryptjs');

async function updateAdminPass() {
    const email = 'admin@school.com';
    const newPassword = 'admin123';

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const [result] = await pool.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, email]
        );

        if (result.affectedRows > 0) {
            console.log(`Password updated to '${newPassword}' for ${email}`);
        } else {
            console.log('User not found.');
        }

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

updateAdminPass();
