const express = require('express');
const router = express.Router();
const { getStudentDashboard, getAttendanceCalendar } = require('../controllers/studentController');
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth, getStudentDashboard);
router.get('/calendar', auth, getAttendanceCalendar);

module.exports = router;
