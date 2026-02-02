const pool = require('../db');

const getStudentDashboard = async (req, res) => {
    // Ideally, get user ID from JWT token (req.user.id)
    // For now, we might pass student_id in query or param for testing, or assume middleware sets req.user
    const userId = req.user ? req.user.id : req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        const [students] = await pool.query('SELECT * FROM students WHERE user_id = ?', [userId]);
        if (students.length === 0) {
            return res.status(404).json({ error: "Student profile not found" });
        }
        const student = students[0];

        // Attendance Summary
        const [attendance] = await pool.query(
            'SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? GROUP BY status',
            [student.id]
        );

        let present = 0;
        let absent = 0;
        attendance.forEach(row => {
            if (row.status === 'PRESENT') present = row.count;
            if (row.status === 'ABSENT') absent = row.count;
        });

        const totalDays = present + absent; // Ignoring holidays for denominator? Or include all?
        // Usually percentage = present / total working days (present + absent)
        const percentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : 0;

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
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAttendanceCalendar = async (req, res) => {
    const userId = req.user ? req.user.id : req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        const [students] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (students.length === 0) return res.status(404).json({ error: "Student not found" });

        const studentId = students[0].id;

        const [rows] = await pool.query(
            "SELECT DATE_FORMAT(date, '%Y-%m-%d') as dateStr, status FROM attendance WHERE student_id = ? ORDER BY date DESC",
            [studentId]
        );

        // Map status to colors
        const coloredRows = rows.map(row => ({
            date: row.dateStr, // Already YYYY-MM-DD string
            status: row.status,
            color: row.status === 'PRESENT' ? 'green' : (row.status === 'ABSENT' ? 'red' : 'grey')
        }));

        res.json(coloredRows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getStudentDashboard, getAttendanceCalendar };
