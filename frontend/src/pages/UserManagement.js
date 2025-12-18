// frontend/src/pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, voter, admin

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      let filteredUsers = response.data || [];
      
      if (filter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filter);
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('✅ User role updated successfully!');
      fetchUsers();
    } catch (error) {
      alert('❌ Failed to update role: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('✅ User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert('❌ Failed to delete user: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
        ← Back to Admin Dashboard
      </button>

      <div className="user-management-container">
        <div className="header">
          <h1>👥 User Management</h1>
          <p>Manage user roles and permissions</p>
        </div>

        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users ({users.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'voter' ? 'active' : ''}`}
            onClick={() => setFilter('voter')}
          >
            Voters
          </button>
          <button 
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>There are no users matching your filter criteria.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.full_name?.charAt(0) || user.phone_number?.charAt(0) || '?'}
                        </div>
                        <span>{user.full_name || 'No name'}</span>
                      </div>
                    </td>
                    <td>{user.phone_number}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <select 
                        className={`role-select ${user.role}`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="voter">Voter</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td>{user.county || 'N/A'}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;