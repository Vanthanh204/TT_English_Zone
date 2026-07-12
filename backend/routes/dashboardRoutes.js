const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Học vụ'), getDashboardStats);

module.exports = router;
