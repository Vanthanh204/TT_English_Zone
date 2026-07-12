const express = require('express');
const router = express.Router();
const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authMiddleware, authorize('Quản lý'), createCourse);
router.put('/:id', authMiddleware, authorize('Quản lý'), updateCourse);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteCourse);

module.exports = router;
