const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { supabase } = require('../config/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, password, fullName, ageGroup, gender } = req.body

    // Validate required fields
    if (!phoneNumber || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, password, and full name are required'
      })
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Get Nakuru county ID
    const { data: county } = await supabase
      .from('counties')
      .select('id')
      .eq('name', 'Nakuru')
      .single()

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        phone_number: phoneNumber,
        password_hash: hashedPassword,
        full_name: fullName,
        age_group: ageGroup || '26-35',
        gender: gender || 'prefer_not_to_say',
        county_id: county.id,
        role: 'voter',
        status: 'active'
      })
      .select('id, phone_number, full_name, role, status, created_at')
      .single()

    if (error) {
      console.error('Registration error:', error)
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    console.log(`✅ New user registered: ${user.phone_number} (${user.full_name})`)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          fullName: user.full_name,
          role: user.role,
          status: user.status,
          createdAt: user.created_at
        },
        token
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    })
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { phoneOrEmail, password } = req.body

    if (!phoneOrEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone/email and password are required'
      })
    }

    // Find user by phone or email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, password_hash, full_name, role, status')
      .or(`phone_number.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
      .single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Account is ${user.status}`
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    console.log(`✅ User logged in: ${user.phone_number} (${user.full_name}) - Role: ${user.role}`)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          fullName: user.full_name,
          role: user.role
        },
        token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed'
    })
  }
})

/**
 * GET /api/auth/locations
 * Get available locations
 */
router.get('/locations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_geographic_hierarchy')
      .select('*')

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch locations'
      })
    }

    res.json({
      success: true,
      data: { locations: data }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations'
    })
  }
})

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, phone_number, email, full_name, age_group, gender,
        role, status, phone_verified, email_verified,
        created_at, last_login_at,
        counties(name), constituencies(name), wards(name)
      `)
      .eq('id', req.user.id)
      .single()

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          email: user.email,
          fullName: user.full_name,
          ageGroup: user.age_group,
          gender: user.gender,
          role: user.role,
          status: user.status,
          location: {
            county: user.counties?.name,
            constituency: user.constituencies?.name,
            ward: user.wards?.name
          },
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        }
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`👋 User logged out: ${req.user.fullName}`)
  
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

module.exports = router