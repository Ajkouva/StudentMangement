const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
    // This is primarily for the initial setup or admin use, as there is no public sign-up
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    try {
        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        // Insert into users
        const [userResult] = await pool.query(
            'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, role]
        );

        // Insert into specific role table
        if (role === 'STUDENT') {
            await pool.query('INSERT INTO students (user_id, name) VALUES (?, ?)', [userId, name]);
        } else if (role === 'TEACHER') {
            await pool.query('INSERT INTO teachers (user_id, name) VALUES (?, ?)', [userId, name]);
        }

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Get extra details based on role
        let userDetails = {};
        if (user.role === 'STUDENT') {
            const [students] = await pool.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
            userDetails = students[0];
        } else if (user.role === 'TEACHER') {
            const [teachers] = await pool.query('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
            userDetails = teachers[0];
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: userDetails?.name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: userDetails?.name,
                details: userDetails
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login };
