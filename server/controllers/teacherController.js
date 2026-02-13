/**
 * TEACHER CONTROLLER
 * 
 * Handles all teacher-related API endpoints including:
 * - Dashboard statistics
 * - Creating new students
 * - Viewing/marking attendance
 * - Generating reports
 * - Finding low-attendance students
 * 
 * TEACHER FEATURES:
 * Teachers can manage students, mark attendance, and view comprehensive reports.
 * This controller contains the most complex queries with JOINs and aggregations.
 */

const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * GET DASHBOARD STATISTICS
 * 
 * Shows teacher an overview of total students and today's attendance
 * 
 * FRONTEND REQUEST:
 * GET /api/teacher/dashboard-stats
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * BACKEND RESPONSE:
 * {
 *   "total_students": 250,
 *   "present_today": 220,
 *   "absent_today": 30,
 *   "academic_performance": "Coming Soon"
 * }
 */
const getDashboardStats = async (req, res) => {
    try {
        // Count total number of students
        const totalQuery = 'SELECT COUNT(*) as count FROM students';
        const totalResult = await pool.query(totalQuery);
        const totalStudents = parseInt(totalResult.rows[0].count);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Count attendance by status for today
        // GROUP BY status gives us separate counts for PRESENT, ABSENT, etc.
        const attendanceQuery = `
            SELECT status, COUNT(*) as count 
            FROM attendance 
            WHERE date = $1 
            GROUP BY status
        `;
        const attendanceResult = await pool.query(attendanceQuery, [today]);

        let present = 0;
        let absent = 0;

        attendanceResult.rows.forEach(row => {
            if (row.status === 'PRESENT') present = parseInt(row.count);
            if (row.status === 'ABSENT') absent = parseInt(row.count);
        });

        res.json({
            total_students: totalStudents,
            present_today: present,
            absent_today: absent,
            academic_performance: "Coming Soon"
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * CREATE NEW STUDENT
 * 
 * Teacher can add a new student to the system
 * This creates both a user account AND a student profile
 * 
 * FRONTEND REQUEST:
 * POST /api/teacher/create-student
 * Body: {
 *   "name": "Jane Smith",
 *   "email": "jane@school.com",
 *   "password": "student123",
 *   "class_name": "10th-A",
 *   "roll_no": 25
 * }
 * 
 * BACKEND RESPONSE:
 * {
 *   "message": "Student created successfully",
 *   "studentIdCode": "STD025"
 * }
 * 
 * DATABASE TRANSACTION:
 * This uses a transaction to ensure data consistency.
 * If any step fails, all changes are rolled back (nothing is saved).
 */
const createStudent = async (req, res) => {
    const { name, email, password, class_name, roll_no } = req.body;

    // Validate all required fields
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!class_name) return res.status(400).json({ error: 'Class is required' });
    if (!roll_no) return res.status(400).json({ error: 'Roll number is required' });

    // Get a dedicated connection for transaction
    // Transactions ensure all-or-nothing: either all queries succeed or none do
    const client = await pool.connect();

    try {
        // Start transaction
        await client.query('BEGIN');

        // Check if email already exists
        const existingQuery = 'SELECT * FROM users WHERE email = $1';
        const existingResult = await client.query(existingQuery, [email]);

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');  // Undo transaction
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if roll number already exists in this class
        const rollQuery = `
            SELECT * FROM students 
            WHERE class_name = $1 AND roll_no = $2
        `;
        const rollResult = await client.query(rollQuery, [class_name, roll_no]);

        if (rollResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Roll number ${roll_no} already exists in class ${class_name}`
            });
        }

        // Create user account
        const insertUserQuery = `
            INSERT INTO users (id, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertUserQuery, [userId, email, passwordHash, 'STUDENT']);

        // Generate student ID code (STD001, STD002, STD003...)
        const countQuery = 'SELECT COUNT(*) as count FROM students';
        const countResult = await client.query(countQuery);
        const nextId = parseInt(countResult.rows[0].count) + 1;
        const studentIdCode = `STD${String(nextId).padStart(3, '0')}`;

        // Create student profile
        const insertStudentQuery = `
            INSERT INTO students (user_id, name, class_name, roll_no, student_id_code) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertStudentQuery, [userId, name, class_name, roll_no, studentIdCode]);

        // Commit transaction (save all changes)
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Student created successfully',
            studentIdCode
        });

    } catch (err) {
        // If any error occurs, undo all changes
        await client.query('ROLLBACK');
        console.error('Create student error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        // Release connection back to pool
        client.release();
    }
};

/**
 * GET ATTENDANCE SHEET
 * 
 * Returns list of students with their attendance status for a specific date
 * Used by teacher to view/mark attendance
 * 
 * FRONTEND REQUEST:
 * GET /api/teacher/attendance-sheet?date=2026-02-13&class_name=10th-A
 * 
 * BACKEND RESPONSE:
 * [
 *   {
 *     student_id: 1,
 *     name: "John Doe",
 *     student_id_code: "STD001",
 *     class_name: "10th-A",
 *     roll_no: 5,
 *     status: "PRESENT"  // or null if not marked yet
 *   },
 *   ...
 * ]
 * 
 * SQL EXPLANATION:
 * LEFT JOIN: Shows all students, even if they don't have attendance for that date
 * If attendance exists, status is shown; otherwise status is null
 */
const getAttendanceSheet = async (req, res) => {
    const { date, class_name } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date required" });
    }

    try {
        // Build query dynamically based on whether class filter is provided
        let query = `
            SELECT 
                s.id as student_id, 
                s.name, 
                s.student_id_code, 
                s.class_name, 
                s.roll_no, 
                a.status 
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
        `;

        const params = [date];

        // Add class filter if specified (and not 'All')
        if (class_name && class_name !== 'All') {
            query += ' WHERE s.class_name = $2';
            params.push(class_name);
        }

        query += ' ORDER BY s.class_name, s.roll_no ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Attendance sheet error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * MARK ATTENDANCE (BULK)
 * 
 * Teacher marks attendance for multiple students at once
 * Uses UPSERT (INSERT or UPDATE) to handle both new and existing records
 * 
 * FRONTEND REQUEST:
 * POST /api/teacher/mark-attendance
 * Body: {
 *   "date": "2026-02-13",
 *   "records": [
 *     { student_id: 1, status: "PRESENT" },
 *     { student_id: 2, status: "ABSENT" },
 *     { student_id: 3, status: "PRESENT" }
 *   ]
 * }
 * 
 * BACKEND RESPONSE:
 * { message: "Attendance updated" }
 * 
 * POSTGRESQL UPSERT:
 * ON CONFLICT ... DO UPDATE is PostgreSQL's UPSERT syntax
 * If record exists (same student_id + date), update it
 * Otherwise, insert new record
 * 
 * (MySQL uses: ON DUPLICATE KEY UPDATE instead)
 */
const markAttendanceBulk = async (req, res) => {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const record of records) {
            // PostgreSQL UPSERT syntax (different from MySQL)
            // CONFLICT constraint name must match the UNIQUE constraint in schema
            const query = `
                INSERT INTO attendance (student_id, date, status)
                VALUES ($1, $2, $3)
                ON CONFLICT (student_id, date) 
                DO UPDATE SET status = EXCLUDED.status
            `;
            // EXCLUDED.status refers to the value we tried to INSERT
            await client.query(query, [record.student_id, date, record.status]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Attendance updated' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Mark attendance error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * GET LOW ATTENDANCE LIST (Defaulters)
 * 
 * Finds students with attendance below 75%
 * Teacher can use this to send warning emails
 * 
 * FRONTEND REQUEST:
 * GET /api/teacher/low-attendance
 * 
 * BACKEND RESPONSE:
 * [
 *   {
 *     student_id: 5,
 *     name: "Student Name",
 *     class_name: "10th-A",
 *     roll_no: 15,
 *     email: "student@school.com",
 *     total_days: 100,
 *     present_days: 70,
 *     percentage: "70.0"
 *   },
 *   ...
 * ]
 * 
 * SQL EXPLANATION:
 * - JOIN: Links students with their user accounts (to get email)
 * - LEFT JOIN: Includes students even if they have no attendance records
 * - GROUP BY: Aggregates attendance data per student
 * - HAVING: Filters groups (like WHERE but for aggregated data)
 * - CASE WHEN: Conditional counting (counts 1 for PRESENT, 0 otherwise)
 */
const getLowAttendanceList = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id as student_id,
                s.name,
                s.class_name,
                s.roll_no,
                u.email,
                COUNT(a.id) as total_days,
                SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN attendance a ON s.id = a.student_id
            GROUP BY s.id, s.name, s.class_name, s.roll_no, u.email
            HAVING COUNT(a.id) > 0 
                AND (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)::float / COUNT(a.id) * 100) < 75
            ORDER BY s.class_name, s.roll_no
        `;
        // ::float is PostgreSQL's type casting (converts integer to float for division)

        const result = await pool.query(query);

        // Calculate percentage for each student
        const students = result.rows.map(row => ({
            ...row,
            total_days: parseInt(row.total_days),
            present_days: parseInt(row.present_days),
            percentage: ((parseInt(row.present_days) / parseInt(row.total_days)) * 100).toFixed(1)
        }));

        res.json(students);

    } catch (err) {
        console.error('Low attendance error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET MONTHLY ATTENDANCE REPORT
 * 
 * Generates detailed attendance report for a specific month
 * Shows attendance statistics for each student
 * 
 * FRONTEND REQUEST:
 * GET /api/teacher/monthly-report?month=2&year=2026&class_name=10th-A
 * 
 * BACKEND RESPONSE:
 * [
 *   {
 *     student_id: 1,
 *     name: "John Doe",
 *     roll_no: 5,
 *     class_name: "10th-A",
 *     total_days: 20,
 *     present_days: 18,
 *     percentage: "90.0"
 *   },
 *   ...
 * ]
 * 
 * SQL EXPLANATION:
 * - EXTRACT: PostgreSQL function to get month/year from date
 *   (MySQL uses MONTH() and YEAR() functions instead)
 * - LEFT JOIN with date filters: Only counts attendance for specified month
 */
const getMonthlyAttendanceReport = async (req, res) => {
    const { month, year, class_name } = req.query;

    if (!month || !year) {
        return res.status(400).json({ error: 'Month and Year are required' });
    }

    try {
        let query = `
            SELECT 
                s.id as student_id,
                s.name,
                s.roll_no,
                s.class_name,
                COUNT(a.id) as total_class_days,
                SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id 
                AND EXTRACT(MONTH FROM a.date) = $1 
                AND EXTRACT(YEAR FROM a.date) = $2
            WHERE 1=1
        `;
        // EXTRACT is PostgreSQL syntax (MySQL uses MONTH() and YEAR())

        const params = [month, year];

        // Add class filter if specified
        if (class_name && class_name !== 'All') {
            query += ' AND s.class_name = $3';
            params.push(class_name);
        }

        query += ' GROUP BY s.id, s.name, s.roll_no, s.class_name ORDER BY s.class_name, s.roll_no';

        const result = await pool.query(query, params);

        // Calculate percentage for each student
        const report = result.rows.map(row => {
            const total = parseInt(row.total_class_days) || 0;
            const present = parseInt(row.present_days) || 0;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

            return {
                ...row,
                present_days: present,
                total_days: total,
                percentage
            };
        });

        res.json(report);

    } catch (err) {
        console.error('Monthly report error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export all controller functions
module.exports = {
    getDashboardStats,
    createStudent,
    getAttendanceSheet,
    markAttendanceBulk,
    getLowAttendanceList,
    getMonthlyAttendanceReport
};
