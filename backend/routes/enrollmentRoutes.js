const express = require('express');
const router = express.Router();
const { registerClass, updateEnrollmentGrade } = require('../controllers/enrollmentController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, authorize('Quản lý', 'Học vụ'), registerClass);
router.put('/:id/grade', authMiddleware, authorize('Quản lý', 'Học vụ', 'Giáo viên'), updateEnrollmentGrade);

module.exports = router;
