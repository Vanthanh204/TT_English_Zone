const express = require('express');
const router = express.Router();
const { createTeacher, getAllTeachers } = require('../controllers/teacherController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, authorize('Quản lý'), getAllTeachers);
router.post('/', authMiddleware, authorize('Quản lý'), createTeacher);

module.exports = router;
