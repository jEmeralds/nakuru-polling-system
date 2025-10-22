import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import adminAPI from '../../services/adminAPI'  // ✅ Correct - imports default export
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Wrap fetchData in useCallback to stabilize it
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllUsers()
      ])

      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array - function doesn't depend on anything

  useEffect(() => {
    // Only run if user exists and is admin
    if (!user) {
      return  // Don't navigate or fetch if no user yet
    }
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/dashboard')
      return
    }

    fetchData()
  }, [user, navigate, fetchData]) // Now fetchData is stable

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await adminAPI.updateUserRole(userId, newRole)
      if (response.data.success) {
        alert('Role updated successfully!')
        fetchData()
      }
    } catch (error) {
      alert('Failed to update role')
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await adminAPI.updateUserStatus(userId, newStatus)
      if (response.data.success) {
        alert('Status updated successfully!')
        fetchData()
      }
    } catch (error) {
      alert('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👨‍💼 Admin Dashboard</h1>
        <p>System Administration & Management</p>
        <button 
          className="manage-issues-btn"
          onClick={() => navigate('/admin/issues')}
        >
          🎯 Manage Issues
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-details">
                <h3>{stats.overview.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h3>{stats.overview.activeUsers}</h3>
                <p>Active Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🗳️</div>
              <div className="stat-details">
                <h3>{stats.overview.voters}</h3>
                <p>Voters</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👨‍💼</div>
              <div className="stat-details">
                <h3>{stats.overview.admins}</h3>
                <p>Administrators</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-details">
                <h3>{stats.overview.newUsersLast7Days}</h3>
                <p>New Users (7 Days)</p>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="demographics-section">
            <div className="demo-card">
              <h3>Age Distribution</h3>
              <div className="demo-list">
                {Object.entries(stats.demographics.ageDistribution).map(([age, count]) => (
                  <div key={age} className="demo-item">
                    <span>{age}</span>
                    <span className="demo-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="demo-card">
              <h3>Gender Distribution</h3>
              <div className="demo-list">
                {Object.entries(stats.demographics.genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="demo-item">
                    <span>{gender}</span>
                    <span className="demo-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="users-table-container">
            <h3>All Registered Users ({users.length})</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.phone_number}</td>
                      <td>
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="voter">Voter</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <select 
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard