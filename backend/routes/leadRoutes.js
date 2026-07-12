const express = require('express');
const router = express.Router();
const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  scheduleTestAppointment
} = require('../controllers/leadController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Public route to register lead
router.post('/', createLead);

// Protected routes
router.get('/', authMiddleware, authorize('Quản lý', 'Tư vấn'), getAllLeads);
router.get('/:id', authMiddleware, authorize('Quản lý', 'Tư vấn'), getLeadById);
router.put('/:id/status', authMiddleware, authorize('Quản lý', 'Tư vấn'), updateLeadStatus);
router.put('/:id/schedule-test', authMiddleware, authorize('Quản lý', 'Tư vấn'), scheduleTestAppointment);
router.delete('/:id', authMiddleware, authorize('Quản lý'), deleteLead);

module.exports = router;
