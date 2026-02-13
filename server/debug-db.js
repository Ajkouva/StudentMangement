/**
 * DEBUG DATABASE SCRIPT
 * 
 * Displays all users in the database and tests admin password
 * Useful for troubleshooting login issues
 * 
 * USAGE:
 * node debug-db.js
 * 
 * OUTPUT:
 * - Lists all users in database (in table format)
 * - Tests if admin password matches "admin123"
 */

const pool = require('./db');
const bcrypt = require('bcryptjs');

async function debugUsers() {
    try {
        // Fetch all users from database
        const result = await pool.query('SELECT * FROM users');
        const users = result.rows;  // PostgreSQL returns results in .rows array

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Users in Database');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.table(users);

        if (users.length > 0) {
            // Find admin user
            const admin = users.find(u => u.email === 'admin@school.com');

            if (admin) {
                console.log('\n✅ Found admin user.');

                // Test if password "admin123" matches stored hash
                const isMatch = await bcrypt.compare('admin123', admin.password_hash);
                console.log(`🔑 Password "admin123" match: ${isMatch ? '✅ YES' : '❌ NO'}`);

                if (!isMatch) {
                    console.log('\n💡 Password doesn\'t match. Run update-pass.js to reset it.');
                }
            } else {
                console.log('\n❌ Admin user NOT found.');
                console.log('💡 Run create-admin.js to create the admin account.');
            }
        } else {
            console.log('\n⚠️  No users found in database.');
            console.log('💡 Run create-admin.js to create the admin account.');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\nMake sure:');
        console.log('  1. PostgreSQL is running');
        console.log('  2. Database schema is initialized (run init-db.js)');
        console.log('  3. .env file has correct credentials');
    } finally {
        await pool.end();
        process.exit(0);
    }
}

debugUsers();
