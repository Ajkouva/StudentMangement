const pool = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
    const email = 'admin@school.com';
    const password = 'admin';
    const name = 'Admin Teacher';

    try {
        const connection = await pool.getConnection();

        // Check if exists
        const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        await connection.beginTransaction();

        // Create User
        await connection.query(
            'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, 'TEACHER']
        );

        // Create Teacher Profile
        await connection.query(
            'INSERT INTO teachers (user_id, name, subject) VALUES (?, ?, ?)',
            [userId, name, 'Administration']
        );

        await connection.commit();
        console.log(`Admin created successfully.\nEmail: ${email}\nPassword: ${password}`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

createAdmin();
