const errorHandler = (error, req, res, next) => {
    console.error('🔥 Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  
    // Default error
    let statusCode = error.statusCode || 500
    let message = error.message || 'Internal Server Error'
  
    // Supabase/PostgreSQL errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          statusCode = 409
          message = 'Resource already exists'
          break
        case '23503': // Foreign key constraint violation
          statusCode = 400
          message = 'Invalid reference to related resource'
          break
        case '23502': // Not null constraint violation
          statusCode = 400
          message = 'Required field is missing'
          break
        default:
          statusCode = 400
          message = 'Database operation failed'
      }
    }
  
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      statusCode = 401
      message = 'Invalid authentication token'
    }
  
    if (error.name === 'TokenExpiredError') {
      statusCode = 401
      message = 'Authentication token has expired'
    }
  
    // Validation errors
    if (error.name === 'ValidationError') {
      statusCode = 400
      message = error.message
    }
  
    res.status(statusCode).json({
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error 
        })
      }
    })
  }
  
  module.exports = errorHandler