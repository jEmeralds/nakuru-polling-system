// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

/**
 * Admin Routes - All require admin or super_admin role
 * Base path: /api/admin
 */

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// ADMIN STATISTICS
// ============================================
router.get('/stats', adminController.getAdminStats);
router.get('/stats/issues', adminController.getIssueStats);

// ============================================
// ISSUE MANAGEMENT
// ============================================
// Get all issues with full details (admin view)
router.get('/issues', adminController.getAllIssues);

// Get single issue with full details
router.get('/issues/:id', adminController.getIssueById);

// Update issue status
router.put('/issues/:id/status', adminController.updateIssueStatus);

// Add admin response to issue
router.put('/issues/:id/response', adminController.addAdminResponse);

// Update issue priority
router.put('/issues/:id/priority', adminController.updateIssuePriority);

// ============================================
// USER MANAGEMENT (for existing AdminDashboard)
// ============================================
// Placeholder routes - you can implement these later
router.get('/users', (req, res) => {
  res.json({ 
    success: true,
    message: 'User management endpoint - to be implemented',
    data: { users: [] }
  });
});

module.exports = router;