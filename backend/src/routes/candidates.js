// =====================================================
// FILE: backend/src/routes/candidates.js
// Candidate Management Routes
// =====================================================

const express = require('express');
const router = express.Router();

// Controllers
const candidatesController = require('../controllers/candidatesController');

// Authentication middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get all candidates (with optional poll filter)
router.get('/', candidatesController.getAllCandidates);

// Get single candidate
router.get('/:id', candidatesController.getCandidateById);

// =====================================================
// ADMIN ROUTES
// =====================================================

// Create candidate
router.post('/', authenticateToken, requireAdmin, candidatesController.createCandidate);

// Update candidate
router.put('/:id', authenticateToken, requireAdmin, candidatesController.updateCandidate);

// Delete candidate
router.delete('/:id', authenticateToken, requireAdmin, candidatesController.deleteCandidate);

module.exports = router;