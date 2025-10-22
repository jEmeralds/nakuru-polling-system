import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.data.success) {
        setProfile(response.data.data.user)
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-box">❌ {error}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.fullName}! 👋</h1>
        <p>Your Nakuru Polls Dashboard</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h2>👤 Your Profile</h2>
          </div>
          <div className="card-content">
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{profile?.fullName || user?.fullName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone Number:</span>
                <span className="info-value">{profile?.phoneNumber || user?.phoneNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value badge">{profile?.role || user?.role}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value badge success">Active</span>
              </div>
              {profile?.location && (
                <>
                  <div className="info-row">
                    <span className="info-label">County:</span>
                    <span className="info-value">{profile.location.county}</span>
                  </div>
                  {profile.location.constituency && (
                    <div className="info-row">
                      <span className="info-label">Constituency:</span>
                      <span className="info-value">{profile.location.constituency}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card stats-card">
          <div className="card-header">
            <h2>🗳️ Your Voting Stats</h2>
          </div>
          <div className="card-content">
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Polls Participated</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Active Polls</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card actions-card">
          <div className="card-header">
            <h2>⚡ Quick Actions</h2>
          </div>
          <div className="card-content">
            <button className="action-btn primary">
              🗳️ View Active Polls
            </button>
            <button className="action-btn">
              📊 View Results
            </button>
            <button className="action-btn">
              📝 My Voting History
            </button>
          </div>
        </div>

        <div className="dashboard-card notifications-card">
          <div className="card-header">
            <h2>🔔 Recent Updates</h2>
          </div>
          <div className="card-content">
            <div className="notification-item">
              <span className="notification-icon">🎉</span>
              <div className="notification-text">
                <strong>Welcome to Nakuru Polls!</strong>
                <p>Your account has been successfully created.</p>
              </div>
            </div>
            <div className="notification-item">
              <span className="notification-icon">ℹ️</span>
              <div className="notification-text">
                <strong>Stay Updated</strong>
                <p>New polls will appear here when available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard