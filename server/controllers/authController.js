/**
 * AUTHENTICATION CONTROLLER
 * 
 * Handles user registration and login functionality.
 * 
 * FLOW OVERVIEW:
 * 1. Frontend sends login/register request with credentials
 * 2. This controller validates the data
 * 3. For login: checks credentials and generates JWT token
 * 4. For register: creates new user account with hashed password
 * 5. JWT token is sent back to frontend
 * 6. Frontend stores token and includes it in future API requests
 * 
 * HOW JWT AUTHENTICATION WORKS:
 * - User logs in → Server generates unique JWT token
 * - Frontend stores token (usually in localStorage)
 * - For protected routes, frontend sends token in request headers
 * - Middleware verifies token before allowing access to protected endpoints
 */

const pool = require('../db');           // Database connection pool
const bcrypt = require('bcryptjs');      // Password hashing library
const jwt = require('jsonwebtoken');     // JSON Web Token for authentication
const { v4: uuidv4 } = require('uuid');  // UUID generator for user IDs

/**
 * REGISTER NEW USER
 * 
 * Creates a new user account (Student or Teacher)
 * 
 * REQUEST BODY (from frontend):
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securePassword123",
 *   "role": "STUDENT"  // or "TEACHER"
 * }
 * 
 * RESPONSE (to frontend):
 * {
 *   "message": "User registered successfully",
 *   "userId": "123e4567-e89b-12d3-a456-426614174000"
 * }
 */
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    try {
        // Check if user already exists with this email
        // PostgreSQL uses $1, $2... for parameterized queries (prevents SQL injection)
        const existingQuery = 'SELECT * FROM users WHERE email = $1';
        const existingResult = await pool.query(existingQuery, [email]);

        // PostgreSQL returns results in .rows array
        if (existingResult.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password (NEVER store passwords in plain text!)
        // Even if database is compromised, passwords remain secure
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate unique user ID using UUID v4
        const userId = uuidv4();

        // Insert new user into users table
        const insertUserQuery = `
            INSERT INTO users (id, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(insertUserQuery, [userId, email, passwordHash, role]);

        // Create role-specific profile
        if (role === 'STUDENT') {
            const insertStudentQuery = 'INSERT INTO students (user_id, name) VALUES ($1, $2)';
            await pool.query(insertStudentQuery, [userId, name]);
        } else if (role === 'TEACHER') {
            const insertTeacherQuery = 'INSERT INTO teachers (user_id, name) VALUES ($1, $2)';
            await pool.query(insertTeacherQuery, [userId, name]);
        }

        // Send success response to frontend
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * USER LOGIN
 * 
 * Authenticates user and returns JWT token
 * 
 * REQUEST BODY (from frontend):
 * {
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * RESPONSE (to frontend):
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "email": "john@example.com",
 *     "role": "STUDENT",
 *     "name": "John Doe",
 *     "details": { ... student/teacher specific data ... }
 *   }
 * }
 * 
 * The frontend will:
 * 1. Store the token (localStorage or state management)
 * 2. Include it in Authorization header for future requests
 * 3. Redirect user to appropriate dashboard (Student/Teacher)
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        // Find user by email
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [email]);

        // Check if user exists
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];  // Get first (and only) user

        // Compare provided password with stored hashed password
        // bcrypt.compare handles the hashing and comparison securely
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Fetch role-specific details (student or teacher profile)
        let userDetails = {};
        if (user.role === 'STUDENT') {
            const studentQuery = 'SELECT * FROM students WHERE user_id = $1';
            const studentResult = await pool.query(studentQuery, [user.id]);
            userDetails = studentResult.rows[0];
        } else if (user.role === 'TEACHER') {
            const teacherQuery = 'SELECT * FROM teachers WHERE user_id = $1';
            const teacherResult = await pool.query(teacherQuery, [user.id]);
            userDetails = teacherResult.rows[0];
        }

        // Generate JWT token
        // Token contains user info and is signed with secret key
        // Token expires in 1 day for security
        const token = jwt.sign(
            { id: user.id, role: user.role, name: userDetails?.name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '1d' }
        );

        // Send token and user data to frontend
        // Frontend will store token and use it for authenticated requests
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
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export functions to be used in routes
module.exports = { register, login };
