// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Authenticate token middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Debug: Log what's in the decoded token
    console.log('🔐 Decoded token:', decoded);
    
    // Handle different token structures
    // Some tokens have: { id, email, role }
    // Others have: { userId, email, role }
    // Others have: { user: { id, email, role } }
    req.user = {
      id: decoded.id || decoded.userId || decoded.user?.id,
      email: decoded.email || decoded.user?.email,
      role: decoded.role || decoded.user?.role
    };
    
    console.log('👤 Attached user to req.user:', req.user);
    
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no token
 * Useful for routes that show different content for authenticated users
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Handle different token structures
      req.user = {
        id: decoded.id || decoded.userId || decoded.user?.id,
        email: decoded.email || decoded.user?.email,
        role: decoded.role || decoded.user?.role
      };
      
      next();
    } catch (error) {
      // Token invalid, but continue anyway
      req.user = null;
      next();
    }
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Require admin role middleware
 * Must be used after authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

/**
 * Require super admin role middleware
 * Must be used after authenticateToken
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin privileges required.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin
};