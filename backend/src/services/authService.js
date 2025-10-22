const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { supabase } = require('../config/database')
const authConfig = require('../config/auth')

class AuthService {
  
  /**
   * Generate JWT token for user
   */
  generateToken(userId, role = 'voter') {
    return jwt.sign(
      { 
        userId, 
        role,
        timestamp: Date.now()
      },
      authConfig.jwtSecret,
      { 
        expiresIn: authConfig.jwtExpiresIn 
      }
    )
  }

  /**
   * Hash password securely
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, authConfig.bcryptRounds)
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Check if phone number already exists
   */
  async checkPhoneExists(phoneNumber) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    return { exists: !!data && !error, user: data }
  }

  /**
   * Check if email already exists
   */
  async checkEmailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    return { exists: !!data && !error, user: data }
  }

  /**
   * Find user by phone number or email
   */
  async findUserByCredentials(phoneOrEmail) {
    // Try to find by phone first
    let { data: user, error } = await supabase
      .from('users')
      .select(`
        id, 
        phone_number, 
        email, 
        password_hash, 
        full_name, 
        role, 
        status,
        phone_verified,
        email_verified,
        county_id,
        constituency_id,
        ward_id
      `)
      .eq('phone_number', phoneOrEmail)
      .single()

    // If not found by phone, try email
    if (error || !user) {
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select(`
          id, 
          phone_number, 
          email, 
          password_hash, 
          full_name, 
          role, 
          status,
          phone_verified,
          email_verified,
          county_id,
          constituency_id,
          ward_id
        `)
        .eq('email', phoneOrEmail)
        .single()

      user = emailUser
      error = emailError
    }

    return { user, error }
  }

  /**
   * Get geographic hierarchy for user location
   */
  async getGeographicData() {
    const { data, error } = await supabase
      .from('v_geographic_hierarchy')
      .select('*')
      .order('county_name, constituency_name, ward_name')

    return { data, error }
  }

  /**
   * Find geographic IDs by names
   */
  async findLocationByNames(countyName, constituencyName = null, wardName = null) {
    let query = supabase
      .from('v_geographic_hierarchy')
      .select('county_id, constituency_id, ward_id')
      .eq('county_name', countyName)

    if (constituencyName) {
      query = query.eq('constituency_name', constituencyName)
    }

    if (wardName) {
      query = query.eq('ward_name', wardName)
    }

    const { data, error } = await query.single()
    return { data, error }
  }

  /**
   * Register a new user
   */
  async registerUser(userData) {
    try {
      const {
        phoneNumber,
        email,
        password,
        fullName,
        ageGroup,
        gender,
        countyName,
        constituencyName,
        wardName,
        educationLevel,
        occupation
      } = userData

      // Hash password
      const hashedPassword = await this.hashPassword(password)

      // Find location IDs
      const { data: locationData, error: locationError } = await this.findLocationByNames(
        countyName, 
        constituencyName, 
        wardName
      )

      if (locationError) {
        return {
          success: false,
          error: 'Invalid location data',
          details: locationError
        }
      }

      // Create user in database
      const { data: user, error: insertError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          email: email || null,
          password_hash: hashedPassword,
          full_name: fullName,
          age_group: ageGroup,
          gender: gender,
          education_level: educationLevel || null,
          occupation: occupation || null,
          county_id: locationData.county_id,
          constituency_id: locationData.constituency_id,
          ward_id: locationData.ward_id,
          registration_source: 'web',
          status: 'active',
          role: 'voter'
        })
        .select(`
          id, 
          phone_number, 
          email, 
          full_name, 
          role, 
          status,
          created_at
        `)
        .single()

      if (insertError) {
        return {
          success: false,
          error: 'Failed to create user',
          details: insertError
        }
      }

      // Generate JWT token
      const token = this.generateToken(user.id, user.role)

      return {
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          status: user.status,
          createdAt: user.created_at
        },
        token
      }

    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Registration failed',
        details: error.message
      }
    }
  }

  /**
   * Login user
   */
  async loginUser(phoneOrEmail, password) {
    try {
      // Find user
      const { user, error } = await this.findUserByCredentials(phoneOrEmail)

      if (error || !user) {
        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return {
          success: false,
          error: `Account is ${user.status}. Please contact support.`
        }
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash)

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)

      // Generate token
      const token = this.generateToken(user.id, user.role)

      return {
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          status: user.status,
          phoneVerified: user.phone_verified,
          emailVerified: user.email_verified
        },
        token
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Login failed',
        details: error.message
      }
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret)
      
      // Get fresh user data
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id, 
          phone_number, 
          email, 
          full_name, 
          role, 
          status,
          phone_verified,
          email_verified
        `)
        .eq('id', decoded.userId)
        .single()

      if (error || !user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      if (user.status !== 'active') {
        return {
          success: false,
          error: 'Account is inactive'
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          status: user.status,
          phoneVerified: user.phone_verified,
          emailVerified: user.email_verified
        },
        decoded
      }

    } catch (error) {
      return {
        success: false,
        error: 'Invalid token',
        details: error.message
      }
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          phone_number,
          email,
          full_name,
          age_group,
          gender,
          education_level,
          occupation,
          role,
          status,
          phone_verified,
          email_verified,
          created_at,
          last_login_at,
          counties!users_county_id_fkey(name, code),
          constituencies!users_constituency_id_fkey(name, code),
          wards!users_ward_id_fkey(name, code)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        return {
          success: false,
          error: 'User not found',
          details: error
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          email: user.email,
          fullName: user.full_name,
          ageGroup: user.age_group,
          gender: user.gender,
          educationLevel: user.education_level,
          occupation: user.occupation,
          role: user.role,
          status: user.status,
          phoneVerified: user.phone_verified,
          emailVerified: user.email_verified,
          location: {
            county: user.counties?.name,
            constituency: user.constituencies?.name,
            ward: user.wards?.name
          },
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        }
      }

    } catch (error) {
      console.error('Get profile error:', error)
      return {
        success: false,
        error: 'Failed to get user profile',
        details: error.message
      }
    }
  }
}

module.exports = new AuthService()