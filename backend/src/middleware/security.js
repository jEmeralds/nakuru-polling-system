// =====================================================
// FILE: backend/src/middleware/security.js
// Security middleware for polling system
// =====================================================

const rateLimit = require('express-rate-limit');
const validator = require('validator');

// =====================================================
// 1. RATE LIMITING
// =====================================================

// General API rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admins (optional)
  skip: (req) => req.user && req.user.role === 'super_admin'
});

// Strict rate limiter for voting (1 vote per 10 seconds)
const votingLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1,
  message: {
    error: 'Please wait 10 seconds between votes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use voter hash as key if available, otherwise IP
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  }
});

// Poll creation rate limiter (for admins, 5 polls per hour)
const pollCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Maximum 5 polls can be created per hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =====================================================
// 2. INPUT SANITIZATION
// =====================================================

// Sanitize all string inputs to prevent XSS
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Trim whitespace
          req.body[key] = req.body[key].trim();
          
          // Escape HTML special characters to prevent XSS
          req.body[key] = validator.escape(req.body[key]);
          
          // Remove any null bytes
          req.body[key] = req.body[key].replace(/\0/g, '');
        } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
          // Recursively sanitize nested objects
          req.body[key] = sanitizeObject(req.body[key]);
        }
      });
    }
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = validator.escape(req.query[key].trim());
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    return res.status(500).json({ error: 'Input validation failed' });
  }
};

// Helper function to sanitize nested objects
const sanitizeObject = (obj) => {
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      sanitized[key] = validator.escape(obj[key].trim());
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

// =====================================================
// 3. INPUT VALIDATION
// =====================================================

// Validate poll creation data
const validatePollCreation = (req, res, next) => {
  const { title, description, position_type, start_date, end_date, options } = req.body;
  const errors = [];
  
  // Validate title
  if (!title || validator.isEmpty(title)) {
    errors.push('Poll title is required');
  } else if (!validator.isLength(title, { min: 10, max: 200 })) {
    errors.push('Poll title must be between 10 and 200 characters');
  }
  
  // Validate position type
  const validPositions = ['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca', 'other'];
  if (!position_type || !validPositions.includes(position_type)) {
    errors.push('Invalid position type');
  }
  
  // Validate dates
  if (!start_date || !validator.isISO8601(start_date)) {
    errors.push('Invalid start date format');
  }
  if (!end_date || !validator.isISO8601(end_date)) {
    errors.push('Invalid end date format');
  }
  if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
    errors.push('End date must be after start date');
  }
  
  // Validate options (must have at least 2)
  if (!options || !Array.isArray(options) || options.length < 2) {
    errors.push('Poll must have at least 2 options');
  } else {
    options.forEach((option, index) => {
      if (!option.option_text || validator.isEmpty(option.option_text)) {
        errors.push(`Option ${index + 1} text is required`);
      }
    });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// Validate voting data
const validateVote = (req, res, next) => {
  const { pollId, optionId } = req.body;
  const errors = [];
  
  // Validate poll ID (UUID format)
  if (!pollId || !validator.isUUID(pollId)) {
    errors.push('Invalid poll ID');
  }
  
  // Validate option ID (UUID format)
  if (!optionId || !validator.isUUID(optionId)) {
    errors.push('Invalid option ID');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// =====================================================
// 4. SECURITY HEADERS
// =====================================================

// Add security headers to all responses
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// =====================================================
// 5. FRAUD DETECTION
// =====================================================

// Check for suspicious voting patterns
const detectSuspiciousVoting = async (req, res, next) => {
  const userId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');
  
  // Attach metadata to request for fraud detection
  req.voteMetadata = {
    userId,
    ipAddress,
    userAgent,
    timestamp: new Date()
  };
  
  // Log suspicious patterns (you can expand this)
  const recentVoteCount = await checkRecentVotes(userId);
  if (recentVoteCount > 10) {
    console.warn(`Suspicious activity detected: User ${userId} voted ${recentVoteCount} times recently`);
    // Don't block, but log for investigation
  }
  
  next();
};

// Helper function to check recent votes (implement with your database)
const checkRecentVotes = async (userId) => {
  // This would query your database
  // For now, return 0 as placeholder
  return 0;
};

// =====================================================
// 6. LOCATION VERIFICATION
// =====================================================

// Verify user is voting in their registered location
const verifyLocation = async (req, res, next) => {
  const { pollId } = req.body;
  const user = req.user;
  
  try {
    // Get poll target location from database
    // const poll = await getPollById(pollId);
    
    // For now, just attach user location to request
    req.userLocation = {
      county: user.county,
      constituency: user.constituency,
      ward: user.ward
    };
    
    // You can add more sophisticated location verification here
    // For example, check if user's location matches poll's target location
    
    next();
  } catch (error) {
    console.error('Location verification error:', error);
    next(); // Don't block the vote, just log the error
  }
};

// =====================================================
// 7. EXPORTS
// =====================================================

module.exports = {
  // Rate limiters
  generalLimiter,
  votingLimiter,
  pollCreationLimiter,
  
  // Sanitization & Validation
  sanitizeInput,
  validatePollCreation,
  validateVote,
  
  // Security
  securityHeaders,
  detectSuspiciousVoting,
  verifyLocation
};

// =====================================================
// USAGE INSTRUCTIONS
// =====================================================

/*
To use these middleware functions in your routes:

1. INSTALL REQUIRED PACKAGES:
   npm install express-rate-limit validator

2. IN YOUR server.js:
   const { securityHeaders, sanitizeInput } = require('./middleware/security');
   app.use(securityHeaders);
   app.use(sanitizeInput);

3. IN YOUR ROUTES:
   
   // Voting route with full security
   const { 
     votingLimiter, 
     validateVote, 
     detectSuspiciousVoting,
     verifyLocation 
   } = require('../middleware/security');
   
   router.post('/vote',
     authenticateToken,        // JWT authentication
     votingLimiter,           // Rate limiting
     validateVote,            // Input validation
     detectSuspiciousVoting,  // Fraud detection
     verifyLocation,          // Location verification
     pollsController.castVote // Your controller
   );
   
   // Poll creation route
   router.post('/polls',
     authenticateToken,
     requireAdmin,
     pollCreationLimiter,
     validatePollCreation,
     pollsController.createPoll
   );

4. ERROR HANDLING:
   All middleware functions send appropriate error responses.
   Make sure to have error handling middleware at the end of your app.
*/