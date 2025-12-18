// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    county: '',
    constituency: '',
    ward: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Assuming you have a /api/profile endpoint
      const response = await api.get('/auth/profile');
      setProfile(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        email: response.data.email || '',
        phone_number: response.data.phone_number || '',
        county: response.data.county || '',
        constituency: response.data.constituency || '',
        ward: response.data.ward || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', formData);
      alert('✅ Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      alert('❌ Failed to update profile: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">{user?.full_name?.charAt(0) || user?.phone_number?.charAt(0) || '👤'}</span>
          </div>
          <h1>{user?.full_name || user?.phone_number}</h1>
          <p className="role-badge">{user?.role || 'voter'}</p>
        </div>

        <div className="profile-content">
          {!editing ? (
            <div className="profile-view">
              <div className="profile-section">
                <h2>Personal Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    <p>{profile?.phone_number || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{profile?.email || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <p>{profile?.role || 'voter'}</p>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2>Location</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>County</label>
                    <p>{profile?.county || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Constituency</label>
                    <p>{profile?.constituency || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Ward</label>
                    <p>{profile?.ward || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <button className="edit-button" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-edit">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h2>Edit Personal Information</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Location Information</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.county}
                        onChange={handleChange}
                        placeholder="Enter your county"
                      />
                    </div>
                    <div className="form-group">
                      <label>Constituency</label>
                      <input
                        type="text"
                        name="constituency"
                        value={formData.constituency}
                        onChange={handleChange}
                        placeholder="Enter your constituency"
                      />
                    </div>
                    <div className="form-group">
                      <label>Ward</label>
                      <input
                        type="text"
                        name="ward"
                        value={formData.ward}
                        onChange={handleChange}
                        placeholder="Enter your ward"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button">
                    💾 Save Changes
                  </button>
                  <button type="button" className="cancel-button" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;