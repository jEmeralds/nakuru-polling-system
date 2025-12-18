// =====================================================
// FILE: frontend/src/pages/admin/AdminCandidates.js
// NEW - Manage Real Candidates (Politicians)
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminCandidates.css';

const AdminCandidates = () => {
  const navigate = useNavigate();
  
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterParty, setFilterParty] = useState('all');

  // Position options
  const positions = [
    { value: 'president', label: 'President' },
    { value: 'governor', label: 'Governor' },
    { value: 'senator', label: 'Senator' },
    { value: 'mp', label: 'Member of Parliament' },
    { value: 'woman_rep', label: 'Woman Representative' },
    { value: 'mca', label: 'Member of County Assembly' }
  ];

  // Party options
  const parties = [
    { value: 'UDA', label: 'UDA' },
    { value: 'ODM', label: 'ODM' },
    { value: 'Jubilee', label: 'Jubilee' },
    { value: 'Azimio', label: 'Azimio' },
    { value: 'Wiper', label: 'Wiper' },
    { value: 'ANC', label: 'ANC' },
    { value: 'Independent', label: 'Independent' }
  ];

  useEffect(() => {
    fetchCandidates();
  }, [filterPosition, filterParty]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPosition !== 'all') params.append('position_id', filterPosition);
      if (filterParty !== 'all') params.append('party_id', filterParty);
      
      const response = await api.get(`/candidates?${params.toString()}`);
      setCandidates(response.data.candidates || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
      await api.delete(`/candidates/${id}`);
      alert('Candidate deleted successfully!');
      fetchCandidates();
    } catch (err) {
      console.error('Error deleting candidate:', err);
      alert(err.response?.data?.error || 'Failed to delete candidate');
    }
  };

  const getPositionLabel = (positionId) => {
    const pos = positions.find(p => p.value === positionId);
    return pos ? pos.label : positionId;
  };

  if (loading) {
    return (
      <div className="admin-candidates-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-candidates-container">
      <div className="page-header">
        <div>
          <h1>👥 Manage Candidates</h1>
          <p>Add and manage real political candidates</p>
        </div>
        <button 
          className="create-candidate-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Add New Candidate
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Position:</label>
          <select 
            value={filterPosition} 
            onChange={(e) => setFilterPosition(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Positions</option>
            {positions.map(pos => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Party:</label>
          <select 
            value={filterParty} 
            onChange={(e) => setFilterParty(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Parties</option>
            {parties.map(party => (
              <option key={party.value} value={party.value}>{party.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="candidates-table-container">
        <table className="candidates-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Party</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No candidates found. Add your first candidate!
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="candidate-name">
                    {candidate.profile_image_url && (
                      <img 
                        src={candidate.profile_image_url} 
                        alt={candidate.name}
                        className="candidate-avatar"
                      />
                    )}
                    {candidate.name}
                  </td>
                  <td>{getPositionLabel(candidate.position_id)}</td>
                  <td>{candidate.party_id || 'N/A'}</td>
                  <td>{candidate.age || 'N/A'}</td>
                  <td>{candidate.gender || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${candidate.verification_status}`}>
                      {candidate.verification_status || 'unverified'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      title="Delete candidate"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Candidate Modal */}
      {showCreateModal && (
        <CreateCandidateModal
          positions={positions}
          parties={parties}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// CREATE CANDIDATE MODAL
// =====================================================

const CreateCandidateModal = ({ positions, parties, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    position_id: 'governor',
    party_id: 'UDA',
    age: '',
    gender: '',
    profession: '',
    education_level: '',
    phone_number: '',
    email: '',
    bio: '',
    campaign_slogan: '',
    campaign_color: '#1b5e20',
    profile_image_url: '',
    manifesto_url: '',
    website_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/candidates', formData);
      alert('Candidate added successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error creating candidate:', err);
      alert(err.response?.data?.error || 'Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Candidate</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="candidate-form">
          <div className="form-row">
            <div className="form-group">
              <label>Candidate Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Kamau"
                required
              />
            </div>

            <div className="form-group">
              <label>Position *</label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                required
              >
                {positions.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Political Party *</label>
              <select
                value={formData.party_id}
                onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                required
              >
                {parties.map(party => (
                  <option key={party.value} value={party.value}>{party.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 45"
                min="18"
                max="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <input
                type="text"
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                placeholder="e.g., Masters in Economics"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g., +254712345678"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Biography</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief bio about the candidate..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Campaign Slogan</label>
            <input
              type="text"
              value={formData.campaign_slogan}
              onChange={(e) => setFormData({ ...formData, campaign_slogan: e.target.value })}
              placeholder="e.g., Building a Better Tomorrow"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Profession</label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="e.g., Business Executive"
              />
            </div>

            <div className="form-group">
              <label>Campaign Color</label>
              <input
                type="color"
                value={formData.campaign_color}
                onChange={(e) => setFormData({ ...formData, campaign_color: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Profile Image URL</label>
            <input
              type="url"
              value={formData.profile_image_url}
              onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Manifesto URL</label>
              <input
                type="url"
                value={formData.manifesto_url}
                onChange={(e) => setFormData({ ...formData, manifesto_url: e.target.value })}
                placeholder="https://example.com/manifesto.pdf"
              />
            </div>

            <div className="form-group">
              <label>Website URL</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://candidatewebsite.com"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCandidates;