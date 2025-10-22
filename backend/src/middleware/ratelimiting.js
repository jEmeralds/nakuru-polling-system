const rateLimit = require('express-rate-limit')
const authConfig = require('../config/auth')

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: authConfig.rateLimits.auth.windowMs,
  max: authConfig.rateLimits.auth.max,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: Math.ceil(authConfig.rateLimits.auth.windowMs / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false
})

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: authConfig.rateLimits.api.windowMs,
  max: authConfig.rateLimits.api.max,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil(authConfig.rateLimits.api.windowMs / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = {
  authLimiter,
  apiLimiter
}