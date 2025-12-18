// =====================================================
// FILE: frontend/src/pages/admin/AdminDashboard.js
// BEAUTIFUL NEW DESIGN
// =====================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await adminAPI.getStats();
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>👨‍💼 Admin Dashboard</h1>
          <p className="subtitle">Welcome back, {user?.full_name}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        <div className="action-card polls" onClick={() => navigate('/admin/polls')}>
          <div className="card-icon">🗳️</div>
          <h3>Manage Polls</h3>
          <p>Create and manage popularity polls</p>
          <div className="card-arrow">→</div>
        </div>

        <div className="action-card users" onClick={() => navigate('/admin/users')}>
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>View and manage system users</p>
          <div className="card-arrow">→</div>
        </div>

        <div className="action-card issues" onClick={() => navigate('/admin/issues')}>
          <div className="card-icon">🎯</div>
          <h3>Issues</h3>
          <p>Manage community issues</p>
          <div className="card-arrow">→</div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="stats-section">
          <h2>System Overview</h2>
          <div className="stats-grid">
            <div className="stat-card users-stat">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.overview.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>

            <div className="stat-card active-stat">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.overview.activeUsers}</h3>
                <p>Active Users</p>
              </div>
            </div>

            <div className="stat-card voters-stat">
              <div className="stat-icon">🗳️</div>
              <div className="stat-content">
                <h3>{stats.overview.voters}</h3>
                <p>Registered Voters</p>
              </div>
            </div>

            <div className="stat-card new-stat">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{stats.overview.newUsersLast7Days}</h3>
                <p>New Users (7d)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demographics */}
      {stats && (
        <div className="demographics-section">
          <h2>User Demographics</h2>
          <div className="demographics-grid">
            <div className="demo-card">
              <h3>Age Distribution</h3>
              <div className="demo-bars">
                {Object.entries(stats.demographics.ageDistribution).map(([age, count]) => (
                  <div key={age} className="demo-bar">
                    <span className="bar-label">{age}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${(count / stats.overview.totalUsers) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="demo-card">
              <h3>Gender Distribution</h3>
              <div className="demo-bars">
                {Object.entries(stats.demographics.genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="demo-bar">
                    <span className="bar-label">{gender}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill gender" 
                        style={{ width: `${(count / stats.overview.totalUsers) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;