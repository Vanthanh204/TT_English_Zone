const express = require('express');
const router = express.Router();
const { generateSchedule, getClassSchedules, updateScheduleSession } = require('../controllers/scheduleController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Chỉ Quản lý và Học vụ mới được tự động sinh lịch học
router.post('/generate', authMiddleware, authorize('Quản lý', 'Học vụ'), generateSchedule);

// Lấy danh sách lịch học của một lớp (Quản lý, Học vụ, Giáo viên đều xem được)
router.get('/class/:classId', authMiddleware, authorize('Quản lý', 'Học vụ', 'Giáo viên'), getClassSchedules);

// Cập nhật thông tin buổi học (Quản lý, Học vụ)
router.put('/:id', authMiddleware, authorize('Quản lý', 'Học vụ'), updateScheduleSession);

module.exports = router;
