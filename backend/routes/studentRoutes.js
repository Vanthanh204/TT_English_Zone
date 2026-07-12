const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  convertLeadToStudent,
  getStudentProfile,
  bulkConvertLeadsToStudents
} = require('../controllers/studentController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Get all & Create student
router.get('/', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Học vụ'), getAllStudents);
router.post('/', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Học vụ'), createStudent);

// Convert lead to student
router.post('/convert-lead/:leadId', authMiddleware, authorize('Quản lý', 'Tư vấn'), convertLeadToStudent);
router.post('/bulk-convert-lead', authMiddleware, authorize('Quản lý', 'Tư vấn'), bulkConvertLeadsToStudents);

// Get by ID, Update, Delete student
router.get('/:id', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Học vụ'), getStudentById);
router.get('/:id/profile', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Học vụ', 'Học viên'), getStudentProfile);
router.put('/:id', authMiddleware, authorize('Quản lý', 'Học vụ'), updateStudent);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteStudent);

module.exports = router;
