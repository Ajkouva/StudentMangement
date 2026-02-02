const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const getDashboardStats = async (req, res) => {
    try {
        const [students] = await pool.query('SELECT COUNT(*) as count FROM students');
        const totalStudents = students[0].count;

        const today = new Date().toISOString().split('T')[0];

        // Count present/absent for today
        const [attendance] = await pool.query(
            'SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status',
            [today]
        );

        let present = 0;
        let absent = 0;

        attendance.forEach(row => {
            if (row.status === 'PRESENT') present = row.count;
            if (row.status === 'ABSENT') absent = row.count;
        });

        res.json({
            total_students: totalStudents,
            present_today: present,
            absent_today: absent,
            academic_performance: "Coming Soon"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createStudent = async (req, res) => {
    const { name, email, password, class_name, roll_no } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!class_name) return res.status(400).json({ error: 'Class is required' });
    if (!roll_no) return res.status(400).json({ error: 'Roll number is required' });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if user exists
        const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if Roll No exists in Class
        const [existingRoll] = await connection.query(
            'SELECT * FROM students WHERE class_name = ? AND roll_no = ?',
            [class_name, roll_no]
        );
        if (existingRoll.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `Roll number ${roll_no} already exists in class ${class_name}` });
        }

        // Create User
        await connection.query(
            'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, 'STUDENT']
        );

        // Generate Student ID Code (STD001, STD002...)
        // Simple logic: STD + (Total + 1)
        const [countResult] = await connection.query('SELECT COUNT(*) as count FROM students');
        const nextId = countResult[0].count + 1;
        const studentIdCode = `STD${String(nextId).padStart(3, '0')}`;

        // Create Student Profile
        await connection.query(
            'INSERT INTO students (user_id, name, class_name, roll_no, student_id_code) VALUES (?, ?, ?, ?, ?)',
            [userId, name, class_name, roll_no, studentIdCode]
        );

        await connection.commit();
        res.status(201).json({ message: 'Student created successfully', studentIdCode });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
};

const getAttendanceSheet = async (req, res) => {
    const { date, class_name } = req.query; // YYYY-MM-DD, class_name (optional)
    if (!date) return res.status(400).json({ error: "Date required" });

    try {
        let query = `
            SELECT s.id as student_id, s.name, s.student_id_code, s.class_name, s.roll_no, a.status 
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
        `;

        const params = [date];

        if (class_name && class_name !== 'All') {
            query += ' WHERE s.class_name = ?';
            params.push(class_name);
        }

        query += ' ORDER BY s.class_name, s.roll_no ASC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const markAttendanceBulk = async (req, res) => {
    const { date, records } = req.body; // records: [{ student_id: 1, status: 'PRESENT' }, ...]

    if (!date || !records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const record of records) {
            // Upsert attendance
            // MySQL: INSERT ... ON DUPLICATE KEY UPDATE
            const query = `
                INSERT INTO attendance (student_id, date, status)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            `;
            await connection.query(query, [record.student_id, date, record.status]);
        }

        await connection.commit();
        res.json({ message: 'Attendance updated' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
};

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
            GROUP BY s.id
            HAVING total_days > 0 AND (present_days / total_days * 100) < 75
            ORDER BY s.class_name, s.roll_no
        `;

        const [rows] = await pool.query(query);

        const students = rows.map(row => ({
            ...row,
            percentage: ((row.present_days / row.total_days) * 100).toFixed(1)
        }));

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

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
                AND MONTH(a.date) = ? 
                AND YEAR(a.date) = ?
            WHERE 1=1
        `;

        const params = [month, year];

        if (class_name && class_name !== 'All') {
            query += ' AND s.class_name = ?';
            params.push(class_name);
        }

        query += ' GROUP BY s.id ORDER BY s.class_name, s.roll_no';

        const [rows] = await pool.query(query, params);

        const report = rows.map(row => {
            const total = row.total_class_days || 0;
            const present = row.present_days || 0;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            return { ...row, present_days: present, total_days: total, percentage };
        });

        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getDashboardStats, createStudent, getAttendanceSheet, markAttendanceBulk, getLowAttendanceList, getMonthlyAttendanceReport };
