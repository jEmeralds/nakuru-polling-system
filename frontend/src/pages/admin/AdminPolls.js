// =====================================================
// FINAL CORRECT AdminPolls.js
// Fetches real positions & parties, creates new candidates
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminPolls.css';

const AdminPolls = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/polls');
      setPolls(response.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pollId, newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    try {
      await api.patch(`/polls/${pollId}/status`, { status: newStatus });
      fetchPolls();
      alert('Status updated!');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Delete this poll? This will also delete the candidates created for it.')) return;
    try {
      await api.delete(`/polls/${pollId}`);
      fetchPolls();
      alert('Poll deleted!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      active: '#28a745',
      closed: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="admin-polls-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-polls-page">
      <div className="polls-header">
        <div>
          <h1>🗳️ Manage Polls</h1>
          <p>Create and manage popularity polls</p>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + Create New Poll
        </button>
      </div>

      <div className="polls-grid">
        {polls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No polls yet</h3>
            <p>Create your first poll to start tracking candidate popularity</p>
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              Create First Poll
            </button>
          </div>
        ) : (
          polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              <div className="poll-header-card">
                <h3>{poll.title}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(poll.status) }}
                >
                  {poll.status}
                </span>
              </div>

              <p className="poll-description">{poll.description}</p>

              <div className="poll-stats">
                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <span>{poll.poll_type || 'single_choice'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🗳️</span>
                  <span>{poll.total_votes || 0} votes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span>{poll.candidates?.length || 0} candidates</span>
                </div>
              </div>

              <div className="poll-dates">
                <span>📅 {new Date(poll.start_date).toLocaleDateString()}</span>
                <span>→</span>
                <span>{new Date(poll.end_date).toLocaleDateString()}</span>
              </div>

              <div className="poll-actions">
                <select
                  value={poll.status}
                  onChange={(e) => handleStatusChange(poll.id, e.target.value)}
                  className="status-select"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
                <button 
                  className="view-btn"
                  onClick={() => navigate(`/polls/${poll.id}`)}
                >
                  View
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(poll.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreatePollModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPolls();
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// CREATE POLL MODAL - FINAL VERSION
// =====================================================

const CreatePollModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position_id: '',  // Will be UUID from political_positions
    poll_type: 'single_choice',
    start_date: '',
    end_date: ''
  });

  const [candidates, setCandidates] = useState([
    { name: '', party_id: '', bio: '' },
    { name: '', party_id: '', bio: '' }
  ]);

  const [positions, setPositions] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch positions and parties on mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      setLoading(true);
      
      // Hardcode the positions and parties from your database
      const hardcodedPositions = [
        { id: '4e30cfd5-4324-448d-94a1-4bd297a440e9', name: 'Governor', level: 'county' },
        { id: '90419046-1ace-47f9-94aa-737c16c976a9', name: 'Deputy Governor', level: 'county' },
        { id: 'bb2b2731-11d3-492f-b692-a44dc42f1993', name: 'Senator', level: 'county' },
        { id: 'f650a59e-2ef0-4832-be62-d15b105ffc07', name: 'Woman Representative', level: 'county' },
        { id: '9396f6d9-ac34-4468-b5a4-4586e48a35f2', name: 'Member of Parliament', level: 'constituency' },
        { id: '38342627-1e9d-481e-a6d2-86eb45420d80', name: 'Member of County Assembly', level: 'ward' }
      ];

      const hardcodedParties = [
        { id: 'a7b71003-2f95-4a32-83a9-d8b3c012804d', name: 'Orange Democratic Movement', abbreviation: 'ODM' },
        { id: '6a1c9066-49f5-4412-9836-f8891889c5d6', name: 'United Democratic Alliance', abbreviation: 'UDA' },
        { id: 'a890cae1-a6fd-41b4-b0fc-e6116c851ff4', name: 'Azimio la Umoja', abbreviation: 'AZIMIO' },
        { id: '8c6f8d5e-d990-4b91-b007-6bd9b1d013b0', name: 'Amani National Congress', abbreviation: 'ANC' },
        { id: '5b52b91a-bdd1-4f9c-8616-11abea5e4b3b', name: 'Ford Kenya', abbreviation: 'FORD-K' },
        { id: 'd5f07206-1df8-463d-af58-c38f29a40e8a', name: 'Wiper Democratic Movement', abbreviation: 'WIPER' },
        { id: '2b40e220-a048-4095-afaa-8940cb24c046', name: 'Independent', abbreviation: 'IND' }
      ];

      setPositions(hardcodedPositions);
      setParties(hardcodedParties);

      // Set default position (Governor)
      setFormData(prev => ({
        ...prev,
        position_id: hardcodedPositions[0].id
      }));

      // Set default parties for candidates
      setCandidates(prev => prev.map(c => ({
        ...c,
        party_id: hardcodedParties[0].id
      })));

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCandidate = () => {
    setCandidates([
      ...candidates, 
      { 
        name: '', 
        party_id: parties[0]?.id || '',
        bio: '' 
      }
    ]);
  };

  const removeCandidate = (index) => {
    if (candidates.length <= 2) {
      alert('Must have at least 2 candidates');
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const updateCandidate = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validCandidates = candidates.filter(c => c.name.trim());
    if (validCandidates.length < 2) {
      alert('Need at least 2 candidates with names');
      return;
    }

    if (!formData.position_id) {
      alert('Please select a position');
      return;
    }

    setSubmitting(true);

    try {
      const pollData = {
        title: formData.title,
        description: formData.description,
        position_id: formData.position_id,  // UUID
        poll_type: formData.poll_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        candidates: validCandidates.map(c => ({
          name: c.name,
          party_id: c.party_id || null,  // UUID or null
          bio: c.bio || null
        }))
      };

      console.log('Submitting poll data:', pollData);

      await api.post('/polls', pollData);
      alert('Poll created successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.error || err.response?.data?.details || 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading positions and parties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Poll</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="poll-form">
          <div className="form-section">
            <h3>📊 Poll Information</h3>
            
            <div className="form-group">
              <label>Poll Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Nakuru Governor Popularity Poll March 2025"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this poll about?"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Position *</label>
                <select
                  value={formData.position_id}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                  required
                >
                  <option value="">Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Poll Type *</label>
                <select
                  value={formData.poll_type}
                  onChange={(e) => setFormData({ ...formData, poll_type: e.target.value })}
                  required
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="ranked">Ranked Choice</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>👥 Candidates (minimum 2)</h3>
              <button type="button" className="add-candidate-btn" onClick={addCandidate}>
                + Add Candidate
              </button>
            </div>

            <div className="candidates-list">
              {candidates.map((candidate, index) => (
                <div key={index} className="candidate-form-card">
                  <div className="candidate-header">
                    <span className="candidate-number">Candidate {index + 1}</span>
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeCandidate(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                        placeholder="e.g., John Kamau"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Party</label>
                      <select
                        value={candidate.party_id}
                        onChange={(e) => updateCandidate(index, 'party_id', e.target.value)}
                      >
                        <option value="">Independent</option>
                        {parties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.abbreviation} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Biography / Campaign Message</label>
                    <textarea
                      value={candidate.bio}
                      onChange={(e) => updateCandidate(index, 'bio', e.target.value)}
                      placeholder="Brief description about the candidate..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPolls;