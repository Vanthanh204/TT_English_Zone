const express = require('express');
const router = express.Router();
const { getTuitions, getTuitionDetail, collectTuition } = require('../controllers/paymentController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Chỉ Quản lý, Học vụ, hoặc Kế toán được quyền quản lý học phí
router.get('/tuition', authMiddleware, authorize('Quản lý', 'Học vụ', 'Kế toán'), getTuitions);
router.get('/tuition/:id', authMiddleware, authorize('Quản lý', 'Học vụ', 'Kế toán'), getTuitionDetail);
router.post('/receipt', authMiddleware, authorize('Quản lý', 'Học vụ', 'Kế toán'), collectTuition);

module.exports = router;
