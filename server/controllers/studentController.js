/**
 * STUDENT CONTROLLER
 * 
 * Handles all student-related API endpoints.
 * Students can view their dashboard, attendance summary, and attendance calendar.
 * 
 * FRONTEND-BACKEND FLOW:
 * 1. Frontend sends request with JWT token in Authorization header
 * 2. Middleware verifies token and extracts user info (req.user)
 * 3. Controller fetches student data from database
 * 4. Results are sent back to frontend as JSON
 * 5. Frontend displays the data in React components
 */

const pool = require('../db');  // PostgreSQL connection pool

/**
 * GET STUDENT DASHBOARD DATA
 * 
 * Fetches student profile and attendance summary
 * 
 * FRONTEND REQUEST:
 * GET /api/student/dashboard
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * BACKEND RESPONSE:
 * {
 *   "profile": {
 *     "name": "John Doe",
 *     "id_code": "STD001",
 *     "class": "10th-A",
 *     "roll_no": 5
 *   },
 *   "attendance_summary": {
 *     "percentage": "85.5",
 *     "total_present": 100,
 *     "total_days": 117
 *   },
 *   "performance": "Coming Soon"
 * }
 */
const getStudentDashboard = async (req, res) => {
    // Get user ID from JWT token (set by auth middleware)
    // Or from query parameter for testing
    const userId = req.user ? req.user.id : req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        // Find student record by user_id
        const studentQuery = 'SELECT * FROM students WHERE user_id = $1';
        const studentResult = await pool.query(studentQuery, [userId]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: "Student profile not found" });
        }

        const student = studentResult.rows[0];

        // Get attendance summary: count PRESENT and ABSENT days
        // GROUP BY groups results by status (PRESENT, ABSENT, HOLIDAY)
        const attendanceQuery = `
            SELECT status, COUNT(*) as count 
            FROM attendance 
            WHERE student_id = $1 
            GROUP BY status
        `;
        const attendanceResult = await pool.query(attendanceQuery, [student.id]);

        // Calculate totals from grouped results
        let present = 0;
        let absent = 0;
        attendanceResult.rows.forEach(row => {
            if (row.status === 'PRESENT') present = parseInt(row.count);
            if (row.status === 'ABSENT') absent = parseInt(row.count);
        });

        const totalDays = present + absent;
        // Calculate attendance percentage (avoid division by zero)
        const percentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0;

        // Send dashboard data to frontend
        res.json({
            profile: {
                name: student.name,
                id_code: student.student_id_code,
                class: student.class_name,
                roll_no: student.roll_no
            },
            attendance_summary: {
                percentage: percentage,
                total_present: present,
                total_days: totalDays
            },
            performance: "Coming Soon"
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET ATTENDANCE CALENDAR
 * 
 * Returns all attendance records for calendar visualization
 * Frontend displays this as a color-coded calendar:
 * - Green dots for PRESENT days
 * - Red dots for ABSENT days
 * - Grey dots for HOLIDAY
 * 
 * FRONTEND REQUEST:
 * GET /api/student/attendance-calendar
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * BACKEND RESPONSE:
 * [
 *   { date: "2026-02-13", status: "PRESENT", color: "green" },
 *   { date: "2026-02-12", status: "ABSENT", color: "red" },
 *   { date: "2026-02-11", status: "PRESENT", color: "green" },
 *   ...
 * ]
 */
const getAttendanceCalendar = async (req, res) => {
    const userId = req.user ? req.user.id : req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        // Get student ID from user_id
        const studentQuery = 'SELECT id FROM students WHERE user_id = $1';
        const studentResult = await pool.query(studentQuery, [userId]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const studentId = studentResult.rows[0].id;

        // Fetch all attendance records for this student
        // PostgreSQL: TO_CHAR formats date as YYYY-MM-DD string
        // (MySQL uses DATE_FORMAT instead)
        const attendanceQuery = `
            SELECT TO_CHAR(date, 'YYYY-MM-DD') as dateStr, status 
            FROM attendance 
            WHERE student_id = $1 
            ORDER BY date DESC
        `;
        const attendanceResult = await pool.query(attendanceQuery, [studentId]);

        // Map status to color for frontend calendar display
        const coloredRows = attendanceResult.rows.map(row => ({
            date: row.datestr,  // PostgreSQL returns lowercase column names
            status: row.status,
            color: row.status === 'PRESENT' ? 'green' :
                (row.status === 'ABSENT' ? 'red' : 'grey')
        }));

        // Send calendar data to frontend
        res.json(coloredRows);

    } catch (err) {
        console.error('Calendar error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export functions to be used in routes
module.exports = { getStudentDashboard, getAttendanceCalendar };
