const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const uploadFields = upload.fields([
  { name: 'AnhDaiDien', maxCount: 1 },
  { name: 'LyLich', maxCount: 1 },
  { name: 'ChungChi', maxCount: 1 }
]);

router.get('/', authMiddleware, authorize('Quản lý', 'Học vụ', 'Tư vấn'), getAllStaff);
router.post('/', authMiddleware, authorize('Quản lý'), uploadFields, createStaff);
router.get('/:id', authMiddleware, authorize('Quản lý', 'Học vụ', 'Tư vấn'), getStaffById);
router.put('/:id', authMiddleware, authorize('Quản lý'), uploadFields, updateStaff);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteStaff);

module.exports = router;
