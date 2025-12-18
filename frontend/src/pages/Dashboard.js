// =====================================================
// FILE: frontend/src/pages/Dashboard.js
// BEAUTIFUL NEW USER DASHBOARD
// =====================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="user-dashboard">
      <div className="dashboard-hero">
        <h1>Welcome, {user?.full_name}! 👋</h1>
        <p>Your voice matters in shaping our community's future</p>
      </div>

      <div className="dashboard-actions">
        <div className="action-card-user primary" onClick={() => navigate('/polls')}>
          <div className="card-icon-large">🗳️</div>
          <h2>Active Polls</h2>
          <p>Vote on current popularity polls and see what others think</p>
          <button className="action-btn">View Polls →</button>
        </div>

        <div className="action-card-user secondary" onClick={() => navigate('/issues')}>
          <div className="card-icon-large">🎯</div>
          <h2>Community Issues</h2>
          <p>Report and track issues in your community</p>
          <button className="action-btn-secondary">View Issues →</button>
        </div>

        <div className="action-card-user tertiary" onClick={() => navigate('/profile')}>
          <div className="card-icon-large">👤</div>
          <h2>Your Profile</h2>
          <p>Manage your account and preferences</p>
          <button className="action-btn-secondary">View Profile →</button>
        </div>
      </div>

      <div className="dashboard-info">
        <h3>📊 How It Works</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-number">1</span>
            <div>
              <h4>Browse Polls</h4>
              <p>See active polls about candidates in your area</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-number">2</span>
            <div>
              <h4>Cast Your Vote</h4>
              <p>Choose your preferred candidate</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-number">3</span>
            <div>
              <h4>See Results</h4>
              <p>View real-time popularity rankings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;