const pool = require('./db');
const bcrypt = require('bcryptjs');

async function debugUsers() {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        console.log('--- Users in DB ---');
        console.table(users);

        if (users.length > 0) {
            const admin = users.find(u => u.email === 'admin@school.com');
            if (admin) {
                console.log('Found admin user.');
                const isMatch = await bcrypt.compare('admin123', admin.password_hash);
                console.log('Password "admin123" match result:', isMatch);
            } else {
                console.log('Admin user NOT found.');
            }
        } else {
            console.log('No users found.');
        }

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

debugUsers();
