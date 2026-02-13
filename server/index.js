/**
 * MAIN SERVER FILE (Entry Point)
 * 
 * This is the heart of the backend application. It:
 * 1. Sets up the Express web server
 * 2. Configures middleware (CORS, JSON parsing)
 * 3. Registers API routes
 * 4. Starts listening for HTTP requests
 * 
 * HOW FRONTEND COMMUNICATES WITH BACKEND:
 * - Frontend makes HTTP requests (GET, POST, etc.) to the API endpoints
 * - Express routes these requests to the appropriate controller functions
 * - Controllers interact with the database using the pool from db.js
 * - Results are sent back to the frontend as JSON responses
 */

const express = require('express');
const cors = require('cors');
const pool = require('./db');  // PostgreSQL connection pool
require('dotenv').config();     // Load environment variables

const app = express();  // Create Express application instance

// ===================================================================
// MIDDLEWARE SETUP
// ===================================================================
// Middleware functions run BEFORE route handlers, processing every request

// CORS (Cross-Origin Resource Sharing)
// Allows frontend (running on port 5173) to communicate with backend (port 5000)
// Without this, browsers would block frontend API calls due to security restrictions
app.use(cors());

// JSON Body Parser
// Parses incoming JSON data from request body (e.g., login credentials, form data)
// Makes it available in controllers as req.body
app.use(express.json());

// ===================================================================
// API ROUTES
// ===================================================================
// Routes define which controller handles which URL endpoint
// When frontend makes a request to /api/auth/login, it goes to authRoutes
// which then calls the appropriate controller function

app.use('/api/auth', require('./routes/authRoutes'));       // Login, Register
app.use('/api/student', require('./routes/studentRoutes')); // Student Dashboard, Attendance
app.use('/api/teacher', require('./routes/teacherRoutes')); // Teacher Dashboard, Student Management

// Root endpoint (just a welcome message)
app.get('/', (req, res) => {
    res.send('School Management API Running (PostgreSQL)');
});

// ===================================================================
// DATABASE CONNECTION TEST ENDPOINT
// ===================================================================
// This endpoint verifies PostgreSQL connection is working
// Visit http://localhost:5000/test-db to check database connectivity
app.get('/test-db', async (req, res) => {
    try {
        // PostgreSQL query: $1 is a placeholder (but we're not using parameters here)
        // The query returns { rows: [...], rowCount: ... }
        const result = await pool.query('SELECT 1 + 1 AS solution');

        res.json({
            message: 'PostgreSQL Database Connected!',
            solution: result.rows[0].solution  // PostgreSQL uses .rows array
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// ===================================================================
// START SERVER
// ===================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}`);
    console.log(`🔍 Test database at http://localhost:${PORT}/test-db`);
});
