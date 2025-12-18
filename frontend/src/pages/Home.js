import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>🗳️ Welcome to Nakuru Polls</h1>
        <p className="hero-subtitle">
          Your Voice Matters in Shaping Nakuru County's Future
        </p>

        {/* Motivational CTA Section */}
        <div className="cta-box">
          <div className="cta-badge">🌟 Make Your Voice Heard</div>
          <h2 className="cta-title">Every Vote Counts</h2>
          <p className="cta-description">
            Join <strong>thousands of Nakuru residents</strong> actively shaping our county's future.
            Your opinion matters in deciding our next leaders.
          </p>
          
          <div className="quick-info">
            <div className="info-item">
              <span className="info-icon">🗳️</span>
              <span className="info-text">5 Positions Available</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⏰</span>
              <span className="info-text">Polls Active Now</span>
            </div>
            <div className="info-item">
              <span className="info-icon">👥</span>
              <span className="info-text">12K+ Participants</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/polls')} 
            className="view-polls-btn"
          >
            View Active Polls →
          </button>
        </div>

        <div className="hero-actions">
          {!isAuthenticated && (
            <>
              <button 
                onClick={() => navigate('/register')} 
                className="hero-btn primary"
              >
                Get Started →
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="hero-btn secondary"
              >
                Login
              </button>
            </>
          )}
        </div>

        <p className="hero-description">
          Participate in polls for Governor, Senator, MP, Woman Rep, and MCA positions.
          Make informed decisions and track real-time results.
        </p>
      </div>

      <div className="features-section">
        <h2>Why Choose Nakuru Polls?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure & Private</h3>
            <p>Your votes are encrypted and completely anonymous</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-Time Results</h3>
            <p>See live polling data and trends as they happen</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Multi-Channel</h3>
            <p>Vote via web, SMS, or WhatsApp - your choice!</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Local Focus</h3>
            <p>From county-level to ward-level representation</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home