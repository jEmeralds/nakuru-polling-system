const authService = require('../services/authService')

/**
 * Middleware to verify JWT token and authenticate requests
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Authentication token required'
      })
    }

    // Verify token
    const result = await authService.verifyToken(token)

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: result.error
      })
    }

    // Add user info to request object
    req.user = result.user
    req.tokenData = result.decoded

    next()

  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An unexpected error occurred'
    })
  }
}

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      })
    }

    // Convert single role to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles]

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${requiredRoles.join(', ')}`
      })
    }

    next()
  }
}

/**
 * Middleware to check if user is admin or super admin
 */
const requireAdmin = requireRole(['admin', 'super_admin'])

/**
 * Middleware to check if user is super admin
 */
const requireSuperAdmin = requireRole(['super_admin'])

/**
 * Optional authentication - adds user info if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const result = await authService.verifyToken(token)
      
      if (result.success) {
        req.user = result.user
        req.tokenData = result.decoded
      }
    }

    next()

  } catch (error) {
    // Don't fail the request for optional auth
    next()
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth
}