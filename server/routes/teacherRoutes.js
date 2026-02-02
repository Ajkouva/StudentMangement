const express = require('express');
const router = express.Router();
const { getDashboardStats, createStudent, getAttendanceSheet, markAttendanceBulk, getLowAttendanceList, getMonthlyAttendanceReport } = require('../controllers/teacherController');
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth, getDashboardStats);
router.post('/students/create', auth, createStudent);
router.get('/attendance-sheet', auth, getAttendanceSheet);
router.post('/attendance/bulk', auth, markAttendanceBulk);
router.get('/low-attendance', auth, getLowAttendanceList);
router.get('/monthly-report', auth, getMonthlyAttendanceReport);

module.exports = router;
