// =====================================================
// FILE: backend/src/controllers/authController.js
// Authentication controller with login, register, and profile
// =====================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

/**
 * REGISTER NEW USER
 */
const register = async (req, res) => {
  try {
    const { phone_number, password, full_name, county, constituency, ward } = req.body;

    console.log('📝 Registration attempt:', phone_number);

    // Validation
    if (!phone_number || !password) {
      return res.status(400).json({ 
        error: 'Phone number and password are required' 
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Phone number already registered' 
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        phone_number,
        password_hash,
        full_name: full_name || null,
        county: county || null,
        constituency: constituency || null,
        ward: ward || null,
        role: 'voter',
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User registered successfully:', phone_number);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error in register:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
};

/**
 * LOGIN USER
 */
const login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    console.log('🔐 Login attempt:', phone_number);

    // Validation
    if (!phone_number || !password) {
      return res.status(400).json({ 
        error: 'Phone number and password are required' 
      });
    }

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid phone number or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid phone number or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${phone_number} (${user.full_name || 'No name'}) - Role: ${user.role}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        county: user.county,
        constituency: user.constituency,
        ward: user.ward
      }
    });

  } catch (error) {
    console.error('❌ Error in login:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
};

/**
 * GET USER PROFILE
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('👤 Fetching profile for user:', userId);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }

    // Don't send password hash to frontend
    delete user.password_hash;

    console.log('✅ Profile fetched successfully');
    res.json(user);

  } catch (error) {
    console.error('❌ Error in getProfile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
};

/**
 * UPDATE USER PROFILE
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, county, constituency, ward } = req.body;

    console.log('✏️ Updating profile for user:', userId);

    const updateData = {};
    
    // Only update fields that were provided
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (county !== undefined) updateData.county = county;
    if (constituency !== undefined) updateData.constituency = constituency;
    if (ward !== undefined) updateData.ward = ward;
    
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }

    // Don't send password hash to frontend
    delete user.password_hash;

    console.log('✅ Profile updated successfully');
    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('❌ Error in updateProfile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
};

/**
 * LOGOUT (optional - token-based, so mainly client-side)
 */
const logout = async (req, res) => {
  try {
    // With JWT, logout is mainly handled client-side by removing the token
    // This endpoint can be used for logging purposes
    console.log('👋 User logged out');
    
    res.json({ 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('❌ Error in logout:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};