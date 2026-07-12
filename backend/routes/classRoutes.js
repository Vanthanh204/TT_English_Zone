const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassRoster
} = require('../controllers/classController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, authorize('Quản lý', 'Giáo viên', 'Học vụ'), getAllClasses);
router.get('/:id', authMiddleware, authorize('Quản lý', 'Giáo viên', 'Học vụ'), getClassById);
router.get('/:id/roster', authMiddleware, authorize('Quản lý', 'Giáo viên', 'Học vụ'), getClassRoster);

router.post('/', authMiddleware, authorize('Quản lý', 'Học vụ'), createClass);
router.put('/:id', authMiddleware, authorize('Quản lý', 'Học vụ'), updateClass);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteClass);

module.exports = router;
