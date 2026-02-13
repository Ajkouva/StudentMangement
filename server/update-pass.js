/**
 * UPDATE PASSWORD SCRIPT
 * 
 * Updates the admin password
 * Useful if you forget the password or want to change it
 * 
 * USAGE:
 * 1. Edit the 'newPassword' variable below with desired password
 * 2. Run: node update-pass.js
 * 
 * DEFAULT ADMIN EMAIL: admin@school.com
 */

const pool = require('./db');
const bcrypt = require('bcryptjs');

async function updateAdminPass() {
    const email = 'admin@school.com';
    const newPassword = 'admin123';  // ← Changed to match test credentials

    try {
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password in database
        const updateQuery = `
            UPDATE users 
            SET password_hash = $1 
            WHERE email = $2
        `;
        const result = await pool.query(updateQuery, [passwordHash, email]);

        // Check if any row was updated
        if (result.rowCount > 0) {
            console.log('✅ Password updated successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 New Password: ${newPassword}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            console.log('❌ User not found.');
            console.log('💡 Run create-admin.js to create the admin account first.');
        }

    } catch (err) {
        console.error('❌ Error updating password:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateAdminPass();
