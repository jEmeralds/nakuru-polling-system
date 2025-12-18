// =====================================================
// FILE: frontend/src/pages/Polls.js
// Fixed: Proper poll status determination based on dates
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Polls.css';

// =====================================================
// HELPER: Determine if poll is actually active
// =====================================================
const isPollActive = (poll) => {
  const now = new Date();
  const startDate = new Date(poll.start_date);
  const endDate = new Date(poll.end_date);
  
  // Poll is active if:
  // 1. Database status is 'active'
  // 2. Current date is between start and end dates
  return poll.status === 'active' && now >= startDate && now <= endDate;
};

const isPollClosed = (poll) => {
  const now = new Date();
  const endDate = new Date(poll.end_date);
  
  // Poll is closed if:
  // 1. Database status is 'closed', OR
  // 2. End date has passed
  return poll.status === 'closed' || now > endDate;
};

// =====================================================
// POLLS LISTING - Active and Past Polls
// =====================================================

const Polls = () => {
  const [activePolls, setActivePolls] = useState([]);
  const [pastPolls, setPastPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL polls (we'll filter by date on frontend)
      const response = await api.get('/polls');
      const allPolls = response.data || [];
      
      console.log('📋 All polls fetched:', allPolls);
      
      // Separate into active and past based on ACTUAL dates
      const active = [];
      const past = [];
      
      allPolls.forEach(poll => {
        const isActive = isPollActive(poll);
        const isClosed = isPollClosed(poll);
        
        console.log(`Poll "${poll.title}":`, {
          status: poll.status,
          end_date: poll.end_date,
          isActive,
          isClosed,
          classification: isActive ? 'ACTIVE' : isClosed ? 'PAST' : 'DRAFT'
        });
        
        if (isActive) {
          active.push(poll);
        } else if (isClosed) {
          past.push(poll);
        } else if (poll.status === 'draft' && isAdmin) {
          // Admins can see draft polls in active section
          active.push(poll);
        }
      });
      
      setActivePolls(active);
      setPastPolls(past);
      
      console.log('✅ Active polls loaded:', active.length);
      console.log('✅ Past polls loaded:', past.length);
      console.log('📊 Active polls:', active.map(p => p.title));
      console.log('📊 Past polls:', past.map(p => p.title));
    } catch (err) {
      console.error('❌ Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="polls-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="polls-page">
      {/* Active Polls Section */}
      <div className="polls-section">
        <div className="section-header">
          <h1>🗳️ Active Polls</h1>
          <p>Vote on your favorite candidates and see live results</p>
        </div>

        {activePolls.length === 0 ? (
          <div className="empty-polls">
            <div className="empty-icon">📊</div>
            <h3>No Active Polls</h3>
            <p>Check back soon for new popularity polls!</p>
          </div>
        ) : (
          <div className="polls-grid">
            {activePolls.map((poll) => {
              const isActive = isPollActive(poll);
              const isDraft = poll.status === 'draft';
              
              return (
                <div 
                  key={poll.id} 
                  className="poll-card active-poll" 
                  onClick={() => navigate(`/polls/${poll.id}`)}
                >
                  <div className={`poll-badge ${isDraft ? 'draft' : 'active'}`}>
                    {isDraft ? '📝 DRAFT' : '🔴 LIVE'}
                  </div>
                  <h3>{poll.title}</h3>
                  <p className="poll-description">{poll.description}</p>
                  
                  <div className="poll-stats">
                    <span className="stat">
                      <span className="stat-icon">📍</span>
                      {poll.poll_type}
                    </span>
                    <span className="stat">
                      <span className="stat-icon">🗳️</span>
                      {poll.total_votes || 0} votes
                    </span>
                    <span className="stat">
                      <span className="stat-icon">👥</span>
                      {poll.candidates?.length || 0} candidates
                    </span>
                  </div>

                  <div className="poll-dates">
                    <span>⏰ Ends {new Date(poll.end_date).toLocaleDateString()}</span>
                  </div>

                  <button className="poll-action-btn primary">
                    {isAdmin ? 'View Results →' : 'Vote Now →'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Polls Section */}
      {pastPolls.length > 0 && (
        <div className="polls-section past-section">
          <div className="section-header">
            <h2>📊 Past Polls</h2>
            <p>View results from completed polls</p>
          </div>

          <div className="polls-grid">
            {pastPolls.map((poll) => (
              <div 
                key={poll.id} 
                className="poll-card past-poll" 
                onClick={() => navigate(`/polls/${poll.id}`)}
              >
                <div className="poll-badge closed">✅ CLOSED</div>
                <h3>{poll.title}</h3>
                <p className="poll-description">{poll.description}</p>
                
                <div className="poll-stats">
                  <span className="stat">
                    <span className="stat-icon">📍</span>
                    {poll.poll_type}
                  </span>
                  <span className="stat">
                    <span className="stat-icon">🗳️</span>
                    {poll.total_votes || 0} votes
                  </span>
                  <span className="stat">
                    <span className="stat-icon">👥</span>
                    {poll.candidates?.length || 0} candidates
                  </span>
                </div>

                <div className="poll-dates">
                  <span>🏁 Ended {new Date(poll.end_date).toLocaleDateString()}</span>
                </div>

                <button className="poll-action-btn secondary">
                  View Results →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// POLL DETAIL & VOTING - With Proper Status Checks
// =====================================================

export const PollDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voting, setVoting] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const loadPoll = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/polls/${id}`);
        setPoll(response.data);
        console.log('✅ Poll detail loaded:', response.data);
      } catch (err) {
        console.error('❌ Error loading poll:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPoll();
  }, [id]);

  const handleVote = async () => {
    // Check if poll is actually still active
    if (!isPollActive(poll)) {
      alert('❌ This poll has ended. Voting is no longer allowed.');
      return;
    }

    if (!selectedCandidate) {
      alert('Please select a candidate');
      return;
    }

    if (!window.confirm('Confirm your vote? This cannot be changed.')) return;

    setVoting(true);
    try {
      await api.post(`/polls/${id}/vote`, {
        pollId: id,
        candidateId: selectedCandidate
      });
      alert('✅ Vote submitted successfully!');
      
      // Refresh poll data
      const response = await api.get(`/polls/${id}`);
      setPoll(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to vote';
      alert('❌ ' + errorMsg);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="poll-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-detail-page">
        <button className="back-button" onClick={() => navigate('/polls')}>
          ← Back to Polls
        </button>
        <div className="error-state">
          <h2>❌ Poll not found</h2>
          <p>This poll may have been deleted or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  // Determine actual poll status based on dates
  const isActive = isPollActive(poll);
  const isClosed = isPollClosed(poll);
  const isDraft = poll.status === 'draft';
  
  let pollStatus = 'DRAFT';
  let statusColor = '#ffc107';
  
  if (isActive) {
    pollStatus = 'LIVE';
    statusColor = '#28a745';
  } else if (isClosed) {
    pollStatus = 'CLOSED';
    statusColor = '#6c757d';
  }

  // Determine if user can vote
  // Users can vote if: not admin, poll is active, haven't voted yet, and not a draft
  const canVote = !isAdmin && isActive && !poll?.has_voted && !isDraft;
  
  // Users should ALWAYS be able to see results (live updates)
  // We'll show voting interface AND results side by side for active polls
  const showVotingInterface = canVote;
  const showResults = true; // Always show results

  return (
    <div className="poll-detail-page">
      <button className="back-button" onClick={() => navigate('/polls')}>
        ← Back to Polls
      </button>
      
      <div className="poll-detail-header">
        <div className="poll-status-badge" style={{ backgroundColor: statusColor }}>
          {pollStatus}
        </div>
        <h1>{poll.title}</h1>
        <p>{poll.description}</p>
        <div className="poll-stats-header">
          <span className="stat-badge">📍 {poll.poll_type}</span>
          <span className="stat-badge">🗳️ {poll.total_votes || 0} votes</span>
          <span className="stat-badge">👥 {poll.candidates?.length || 0} candidates</span>
          {isActive && (
            <span className="stat-badge">⏰ Ends {new Date(poll.end_date).toLocaleDateString()}</span>
          )}
          {isClosed && (
            <span className="stat-badge">🏁 Ended {new Date(poll.end_date).toLocaleDateString()}</span>
          )}
        </div>

        {/* Admin Notice */}
        {isAdmin && (
          <div className="admin-notice">
            👑 <strong>Admin View:</strong> You can view results but cannot vote
          </div>
        )}

        {/* Poll Closed Notice */}
        {isClosed && !isAdmin && (
          <div className="closed-notice">
            🏁 <strong>This poll has ended.</strong> Voting is no longer allowed.
          </div>
        )}

        {/* Already Voted Notice */}
        {poll.has_voted && !isAdmin && isActive && (
          <div className="voted-notice">
            ✅ <strong>You have already voted in this poll.</strong>
          </div>
        )}
      </div>

      {/* Voting Section - For users who can vote */}
      {showVotingInterface && (
        <div className="voting-section">
          <h2>🗳️ Cast Your Vote</h2>
          <div className="candidates-grid">
            {poll.candidates?.map((candidate) => (
              <div
                key={candidate.id}
                className={`candidate-card ${selectedCandidate === candidate.id ? 'selected' : ''}`}
                onClick={() => setSelectedCandidate(candidate.id)}
              >
                <div className="candidate-avatar">
                  {candidate.profile_image_url ? (
                    <img src={candidate.profile_image_url} alt={candidate.name} />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </div>
                <h3>{candidate.name}</h3>
                <p className="candidate-party">{candidate.party?.abbreviation || 'Independent'}</p>
                {candidate.campaign_slogan && (
                  <p className="candidate-slogan">"{candidate.campaign_slogan}"</p>
                )}
                {candidate.bio && (
                  <p className="candidate-bio">{candidate.bio}</p>
                )}
                <div className="select-indicator">
                  {selectedCandidate === candidate.id && '✓ Selected'}
                </div>
              </div>
            ))}
          </div>
          <div className="vote-action">
            <button
              className="submit-vote-btn"
              onClick={handleVote}
              disabled={!selectedCandidate || voting}
            >
              {voting ? 'Submitting...' : '🗳️ Submit Vote'}
            </button>
          </div>
        </div>
      )}

      {/* Results Section - Always shown to everyone */}
      {showResults && (
        <div className="results-section">
          <h2>📊 {showVotingInterface ? 'Live Results' : 'Poll Results'}</h2>

          <div className="results-list">
            {poll.candidates
              ?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
              .map((candidate, index) => {
                const voteCount = candidate.vote_count || 0;
                const percentage = poll.total_votes > 0 
                  ? ((voteCount / poll.total_votes) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={candidate.id} className={`result-item ${index === 0 && poll.total_votes > 0 ? 'leading' : ''}`}>
                    <div className="result-header">
                      <div className="result-info">
                        {index === 0 && poll.total_votes > 0 && <span className="crown">👑</span>}
                        <h3>{candidate.name}</h3>
                        <span className="result-party">{candidate.party?.abbreviation || 'IND'}</span>
                      </div>
                      <div className="result-stats">
                        <span className="result-votes">{voteCount} votes</span>
                        <span className="result-percentage">{percentage}%</span>
                      </div>
                    </div>
                    <div className="result-bar-container">
                      <div 
                        className="result-bar"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          
          {poll.total_votes === 0 && (
            <p className="no-votes-yet">No votes yet. Be the first to vote!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Polls;