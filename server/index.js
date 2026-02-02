const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes')); // This serves the Student Dashboard
app.use('/api/teacher', require('./routes/teacherRoutes'));
// app.use('/api/attendance', require('./routes/attendanceRoutes')); // Logic moved to Teacher Routes for now

app.get('/', (req, res) => {
    res.send('School Management API Running (MySQL)');
});

// Test DB Connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database Connected!', solution: rows[0].solution });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
