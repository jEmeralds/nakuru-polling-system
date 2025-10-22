require('dotenv').config()

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
  jwtExpiresIn: '7d',
  bcryptRounds: 12,
  
  // Rate limiting
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // limit each IP to 5 requests per windowMs
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes  
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
}

module.exports = authConfig