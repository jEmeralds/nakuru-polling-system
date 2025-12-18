// backend/src/routes/polls.js
const express = require('express');
const router = express.Router();
const pollsController = require('../controllers/pollsController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/polls
 * @desc    Create a new poll (Admin only)
 * @access  Private/Admin
 */
router.post('/', authenticateToken, requireAdmin, pollsController.createPoll);

/**
 * @route   GET /api/polls
 * @desc    Get all polls (public sees active, admins see all)
 * @access  Public/Optional Auth
 */
router.get('/', optionalAuth, pollsController.getAllPolls);

/**
 * @route   GET /api/polls/:id
 * @desc    Get a single poll by ID with vote results
 * @access  Public
 */
router.get('/:id', pollsController.getPollById);

/**
 * @route   POST /api/polls/:id/vote
 * @desc    Cast a vote on a poll
 * @access  Private (Authenticated users)
 */
router.post('/:id/vote', authenticateToken, pollsController.castVote);

/**
 * @route   PATCH /api/polls/:id/status
 * @desc    Update poll status (Admin only)
 * @access  Private/Admin
 */
router.patch('/:id/status', authenticateToken, requireAdmin, pollsController.updatePollStatus);

/**
 * @route   DELETE /api/polls/:id
 * @desc    Delete a poll (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticateToken, requireAdmin, pollsController.deletePoll);

module.exports = router;