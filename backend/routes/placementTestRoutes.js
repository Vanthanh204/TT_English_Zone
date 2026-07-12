const express = require('express');
const router = express.Router();
const {
  recordTestResult,
  getTestResultByLead,
  updateTestResult
} = require('../controllers/placementTestController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Giáo viên'), recordTestResult);
router.get('/lead/:leadId', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Giáo viên'), getTestResultByLead);
router.put('/lead/:leadId', authMiddleware, authorize('Quản lý', 'Tư vấn', 'Giáo viên'), updateTestResult);

module.exports = router;
