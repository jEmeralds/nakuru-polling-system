// =====================================================
// FILE: backend/src/routes/polls.js
// Polls API routes with security middleware
// =====================================================

const express = require('express');
const router = express.Router();

// Controllers
const pollsController = require('../controllers/pollsController');

// Authentication middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Security middleware
const {
  generalLimiter,
  votingLimiter,
  pollCreationLimiter,
  validatePollCreation,
  validateVote,
  detectSuspiciousVoting,
  verifyLocation
} = require('../middleware/security');

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

// Get all active polls (public access)
router.get(
  '/active',
  generalLimiter,
  pollsController.getAllPolls
);

// =====================================================
// AUTHENTICATED ROUTES (Requires login)
// =====================================================

// Get all polls (with filters)
router.get(
  '/',
  authenticateToken,
  generalLimiter,
  pollsController.getAllPolls
);

// Get single poll details
router.get(
  '/:id',
  authenticateToken,
  generalLimiter,
  pollsController.getPollById
);

// Get poll results
router.get(
  '/:id/results',
  authenticateToken,
  generalLimiter,
  pollsController.getPollResults
);

// Cast vote (MOST SECURE ENDPOINT)
router.post(
  '/vote',
  authenticateToken,           // Must be logged in
  votingLimiter,              // Rate limit: 1 vote per 10 seconds
  validateVote,               // Validate input format
  detectSuspiciousVoting,     // Fraud detection
  verifyLocation,             // Location verification
  pollsController.castVote    // Controller function
);

// =====================================================
// ADMIN ROUTES (Requires admin role)
// =====================================================

// Create new poll
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  pollCreationLimiter,        // Max 5 polls per hour
  validatePollCreation,       // Validate poll data
  pollsController.createPoll
);

// Update poll status
router.patch(
  '/:id/status',
  authenticateToken,
  requireAdmin,
  generalLimiter,
  pollsController.updatePollStatus
);

// Delete poll
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  generalLimiter,
  pollsController.deletePoll
);

// Get fraud alerts
router.get(
  '/admin/fraud-alerts',
  authenticateToken,
  requireAdmin,
  generalLimiter,
  pollsController.getFraudAlerts
);

// =====================================================
// ERROR HANDLING
// =====================================================

// Handle invalid routes
router.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;

// =====================================================
// API DOCUMENTATION
// =====================================================

/*
POLLS API ENDPOINTS

BASE URL: http://localhost:3001/api/polls

=====================================
PUBLIC ENDPOINTS
=====================================

GET /active
  Description: Get all active polls
  Auth: None
  Query Params:
    - position_type (optional): Filter by position
    - location_level (optional): Filter by location
  Response: { success: true, count: 5, polls: [...] }

=====================================
AUTHENTICATED ENDPOINTS
=====================================

GET /
  Description: Get all polls with filters
  Auth: Required (JWT token)
  Query Params:
    - status: 'draft' | 'active' | 'closed' | 'cancelled'
    - position_type: 'president' | 'governor' | 'senator' | 'mp' | 'woman_rep' | 'mca' | 'other'
    - active_only: 'true' | 'false'
  Response: { success: true, count: 10, polls: [...] }

GET /:id
  Description: Get single poll with details
  Auth: Required (JWT token)
  Response: {
    success: true,
    poll: {
      id, title, description, position_type, target_location,
      start_date, end_date, status, total_votes,
      poll_options: [...],
      has_voted: true/false,
      results: {...} or null
    }
  }

GET /:id/results
  Description: Get poll results
  Auth: Required (JWT token)
  Response: {
    success: true,
    results: {
      total_votes: 1543,
      options: [
        { id, option_text, candidate_name, vote_count, vote_percentage },
        ...
      ],
      breakdown: {
        by_location: { "Nakuru": 823, "Nairobi": 720 }
      }
    }
  }

POST /vote
  Description: Cast a vote in a poll
  Auth: Required (JWT token)
  Rate Limit: 1 request per 10 seconds
  Body: {
    pollId: "uuid",
    optionId: "uuid"
  }
  Response: {
    success: true,
    message: "Vote cast successfully",
    anonymous: true,
    results: {...} or null
  }
  Errors:
    - 400: Poll not active / already voted / poll ended
    - 404: Poll or option not found
    - 429: Rate limit exceeded

=====================================
ADMIN ENDPOINTS
=====================================

POST /
  Description: Create a new poll
  Auth: Required (Admin role)
  Rate Limit: 5 polls per hour
  Body: {
    title: "Poll title (10-200 chars)",
    description: "Poll description",
    position_type: "governor",
    target_location: {"level": "county", "county_name": "Nakuru"},
    start_date: "2025-10-10T00:00:00Z",
    end_date: "2025-11-10T23:59:59Z",
    options: [
      {
        option_text: "Candidate A",
        candidate_name: "John Doe",
        party_affiliation: "ODM",
        description: "Brief bio",
        image_url: "https://..."
      },
      ...
    ],
    is_anonymous: true,
    require_location_verification: true,
    allow_result_viewing: true
  }
  Response: {
    success: true,
    message: "Poll created successfully",
    poll: {...}
  }

PATCH /:id/status
  Description: Update poll status
  Auth: Required (Admin role)
  Body: {
    status: "draft" | "active" | "closed" | "cancelled"
  }
  Response: {
    success: true,
    message: "Poll status updated to active",
    poll: {...}
  }

DELETE /:id
  Description: Delete a poll (only if no votes)
  Auth: Required (Admin role)
  Response: {
    success: true,
    message: "Poll deleted successfully"
  }
  Error:
    - 400: Cannot delete poll with votes

GET /admin/fraud-alerts
  Description: Get fraud detection alerts
  Auth: Required (Admin role)
  Query Params:
    - pollId (optional): Filter by poll
    - severity (optional): 'low' | 'medium' | 'high' | 'critical'
    - status (optional): 'open' | 'investigating' | 'resolved' | 'false_positive'
  Response: {
    success: true,
    count: 3,
    alerts: [
      {
        id, poll_id, alert_type, evidence,
        severity, status, detected_at
      },
      ...
    ]
  }

=====================================
SECURITY FEATURES
=====================================

1. RATE LIMITING:
   - General endpoints: 100 requests per 15 minutes
   - Voting endpoint: 1 request per 10 seconds
   - Poll creation: 5 polls per hour

2. AUTHENTICATION:
   - JWT tokens required for most endpoints
   - Role-based access (admin vs voter)

3. INPUT VALIDATION:
   - All inputs sanitized to prevent XSS
   - UUID validation for IDs
   - Date format validation
   - Length constraints enforced

4. ANONYMOUS VOTING:
   - Voter identity hashed using SHA-256
   - IP addresses hashed for fraud detection
   - User IDs encrypted for admin investigations

5. FRAUD DETECTION:
   - Automatic detection of suspicious patterns
   - Location verification
   - Duplicate vote prevention
   - Rate limit monitoring

=====================================
ERROR CODES
=====================================

200: Success
201: Created
400: Bad Request (validation error, duplicate vote)
401: Unauthorized (no token or invalid token)
403: Forbidden (insufficient permissions)
404: Not Found
429: Too Many Requests (rate limit exceeded)
500: Internal Server Error

=====================================
SETUP INSTRUCTIONS
=====================================

1. Add to backend/src/server.js:
   const pollsRoutes = require('./routes/polls');
   app.use('/api/polls', pollsRoutes);

2. Ensure middleware is loaded in server.js:
   const { securityHeaders, sanitizeInput } = require('./middleware/security');
   app.use(securityHeaders);
   app.use(sanitizeInput);

3. Install required packages:
   npm install express-rate-limit validator

4. Add to .env:
   VOTE_SALT=your-random-salt-min-32-chars
   ENCRYPTION_KEY=64-char-hex-string

5. Run database schema (polls_schema.sql)

6. Test endpoints with Postman or curl
*/