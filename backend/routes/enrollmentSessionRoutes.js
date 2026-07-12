const express = require('express');
const router = express.Router();
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} = require('../controllers/enrollmentSessionController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.post('/', authMiddleware, authorize('Quản lý'), createSession);
router.put('/:id', authMiddleware, authorize('Quản lý'), updateSession);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteSession);

module.exports = router;
