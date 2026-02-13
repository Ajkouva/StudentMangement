/**
 * CREATE ADMIN USER SCRIPT
 * 
 * Creates the initial admin/teacher account for the system
 * Run this AFTER database initialization (init-db.js)
 * 
 * USAGE:
 * node create-admin.js
 * 
 * DEFAULT CREDENTIALS:
 * Email: admin@school.com
 * Password: admin
 * 
 * You can change the password later by:
 * 1. Editing update-pass.js with new password
 * 2. Running: node update-pass.js
 */

const pool = require('./db');          // PostgreSQL connection pool
const bcrypt = require('bcryptjs');    // Password hashing
const { v4: uuidv4 } = require('uuid'); // UUID generator

async function createAdmin() {
    const email = 'admin@school.com';
    const password = 'admin';
    const name = 'Admin Teacher';

    try {
        // Check if admin already exists
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);

        if (checkResult.rows.length > 0) {
            console.log('ℹ️  Admin user already exists.');
            console.log(`📧 Email: ${email}`);
            console.log('💡 Use update-pass.js to reset the password if needed.');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        // Get a transaction client
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create user account
            const insertUserQuery = `
                INSERT INTO users (id, email, password_hash, role) 
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(insertUserQuery, [userId, email, passwordHash, 'TEACHER']);

            // Create teacher profile
            const insertTeacherQuery = `
                INSERT INTO teachers (user_id, name, subject) 
                VALUES ($1, $2, $3)
            `;
            await client.query(insertTeacherQuery, [userId, name, 'Administration']);

            await client.query('COMMIT');

            console.log('✅ Admin created successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ Error creating admin:', err.message);
    } finally {
        // Important: End the pool to allow script to exit
        await pool.end();
        process.exit(0);
    }
}

createAdmin();
