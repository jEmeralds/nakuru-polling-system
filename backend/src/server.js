require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// =====================================================
// FILE: backend/src/server.js
// Complete Server with Cron Jobs
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const supabase = require('./config/database');
const { initializeCronJobs } = require('./services/pollCronService');

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security middleware
app.use(helmet());

// CORS configuration - Allow both development and production
const allowedOrigins = [
  'http://localhost:3000',
  'https://nakuru-polling-system.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Supabase client to all requests
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const issuesRoutes = require('./routes/issues');
const pollsRoutes = require('./routes/polls');
const candidatesRoutes = require('./routes/candidates');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/candidates', candidatesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =====================================================
// INITIALIZE AUTOMATED TASKS
// =====================================================

initializeCronJobs();

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🔗 Initializing Supabase connection...');
  console.log('✅ Supabase client initialized successfully');
  console.log('=====================================');
  console.log('🚀 Nakuru Polling System API Started');
  console.log('=====================================');
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('📋 Available routes:');
  console.log('   - /api/auth (Authentication)');
  console.log('   - /api/admin (Admin management)');
  console.log('   - /api/issues (Issues system)');
  console.log('   - /api/polls (Polls system) ✅');
  console.log('   - /api/candidates (Candidates)');
  console.log('=====================================');
});

module.exports = app;