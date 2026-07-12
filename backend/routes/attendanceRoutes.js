const express = require('express');
const router = express.Router();
const { getAttendanceSession, saveAttendanceSession } = require('../controllers/attendanceController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Giáo viên, Học vụ, Quản lý đều được quyền xem danh sách điểm danh buổi học
router.get('/session/:scheduleId', authMiddleware, authorize('Quản lý', 'Học vụ', 'Giáo viên'), getAttendanceSession);

// Giáo viên, Học vụ, Quản lý đều được quyền thực hiện điểm danh
router.post('/session/:scheduleId', authMiddleware, authorize('Quản lý', 'Học vụ', 'Giáo viên'), saveAttendanceSession);

module.exports = router;
