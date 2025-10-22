const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const issuesController = require('../controllers/issuesController');

/**
 * Issues Routes
 */

// GET /api/issues/categories - PUBLIC (no auth needed)
router.get('/categories', issuesController.getCategories);

// All other routes require authentication
router.get('/', authenticateToken, issuesController.getIssues);
router.get('/:id', authenticateToken, issuesController.getIssueById);
router.post('/', authenticateToken, issuesController.createIssue);
router.put('/:id/status', authenticateToken, issuesController.updateIssueStatus);
router.post('/:id/upvote', authenticateToken, issuesController.toggleUpvote);
router.get('/:id/comments', authenticateToken, issuesController.getComments);
router.post('/:id/comments', authenticateToken, issuesController.addComment);
router.post('/:id/view', authenticateToken, issuesController.incrementView);

module.exports = router;