// =====================================================
// FILE: frontend/src/pages/PollDetail.js
// FIXED - All bugs resolved
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getPollById, 
  castVote, 
  getPositionLabel, 
  getStatusColor
} from '../services/pollsAPI';
import './PollDetail.css';

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [voteError, setVoteError] = useState(null);
  
  useEffect(() => {
    fetchPollDetails();
  }, [id]);
  
  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      const data = await getPollById(id);
      setPoll(data.poll);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch poll:', err);
      setError('Failed to load poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVote = async () => {
    if (!selectedOption) {
      setVoteError('Please select an option before voting');
      return;
    }
    
    try {
      setVoting(true);
      setVoteError(null);
      
      const result = await castVote(id, selectedOption);
      
      // Refresh poll to get updated data
      await fetchPollDetails();
      
      setVoteSuccess(true);
      
      // Auto-scroll to results after 1 second
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 1000);
      
    } catch (err) {
      console.error('Vote failed:', err);
      setVoteError(err.response?.data?.error || 'Failed to cast vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };
  
  const calculatePercentage = (voteCount, totalVotes) => {
    if (totalVotes === 0) return 0;
    return ((voteCount / totalVotes) * 100).toFixed(1);
  };
  
  if (loading) {
    return (
      <div className="poll-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }
  
  if (error || !poll) {
    return (
      <div className="poll-detail-container">
        <div className="error-state">
          <p className="error-message">⚠️ {error || 'Poll not found'}</p>
          <button onClick={() => navigate('/polls')} className="back-btn">
            ← Back to Polls
          </button>
        </div>
      </div>
    );
  }
  
  // ✅ FIXED: Calculate vote eligibility without calling async function
  const canUserVote = !poll.has_voted && poll.status === 'active';
  const voteEligibility = {
    canVote: canUserVote,
    reason: poll.has_voted 
      ? 'You have already voted in this poll' 
      : poll.status !== 'active' 
      ? 'This poll is not currently active' 
      : ''
  };
  
  const showResults = poll.has_voted || poll.status === 'closed' || poll.allow_result_viewing;
  
  return (
    <div className="poll-detail-container">
      {/* Back Button */}
      <button onClick={() => navigate('/polls')} className="back-link">
        ← Back to Polls
      </button>
      
      {/* Poll Header */}
      <div className="poll-detail-header">
        <div className="header-content">
          <div className="header-left">
            <span 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(poll.status) }}
            >
              {poll.status.toUpperCase()}
            </span>
            <h1>{poll.title}</h1>
            <p className="position-label">{getPositionLabel(poll.position_type)}</p>
          </div>
          
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-icon">👥</span>
              <span className="stat-number">{poll.total_votes || 0}</span>
              <span className="stat-label">Total Votes</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">📊</span>
              {/* ✅ FIXED: Changed candidate to candidates (plural) */}
              <span className="stat-number">{poll.candidates?.length || 0}</span>
              <span className="stat-label">Candidates</span>
            </div>
          </div>
        </div>
        
        {poll.description && (
          <p className="poll-description">{poll.description}</p>
        )}
        
        {/* Poll Timeline */}
        <div className="poll-timeline">
          <div className="timeline-item">
            <span className="timeline-icon">🗓️</span>
            <span className="timeline-label">Starts:</span>
            <span className="timeline-value">
              {new Date(poll.start_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="timeline-item">
            <span className="timeline-icon">⏰</span>
            <span className="timeline-label">Ends:</span>
            <span className="timeline-value">
              {new Date(poll.end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Vote Success Message */}
      {voteSuccess && (
        <div className="success-banner">
          <span className="success-icon">✅</span>
          <div>
            <strong>Vote Submitted Successfully!</strong>
            <p>Thank you for participating in this poll.</p>
          </div>
        </div>
      )}
      
      {/* Voting Section */}
      {!poll.has_voted && voteEligibility.canVote && (
        <div className="voting-section">
          <h2>Cast Your Vote</h2>
          <p className="voting-instruction">
            Select one candidate below and click "Submit Vote" to participate.
          </p>
          
          {voteError && (
            <div className="vote-error">
              <span>⚠️</span> {voteError}
            </div>
          )}
          
          <div className="options-list">
            {poll.candidates && poll.candidates.length > 0 ? (
              poll.candidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`option-card ${selectedOption === candidate.id ? 'selected' : ''}`}
                  onClick={() => !voting && setSelectedOption(candidate.id)}
                >
                  <div className="option-number">{index + 1}</div>
                  <div className="option-content">
                    <h3>{candidate.name}</h3>
                    {candidate.party && (
                      <p className="party-affiliation">🏛️ {candidate.party}</p>
                    )}
                    {candidate.bio && (
                      <p className="option-description">{candidate.bio}</p>
                    )}
                  </div>
                  <div className="radio-button">
                    {selectedOption === candidate.id && <div className="radio-inner"></div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-candidates">
                <p>No candidates have been added to this poll yet.</p>
              </div>
            )}
          </div>
          
          {poll.candidates && poll.candidates.length > 0 && (
            <button
              onClick={handleVote}
              disabled={!selectedOption || voting}
              className="submit-vote-btn"
            >
              {voting ? (
                <>
                  <span className="btn-spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <span>🗳️</span>
                  Submit Vote
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Voting Not Available Message */}
      {!voteEligibility.canVote && (
        <div className="vote-unavailable">
          <span className="info-icon">ℹ️</span>
          <div>
            <strong>Voting Not Available</strong>
            <p>{voteEligibility.reason}</p>
          </div>
        </div>
      )}
      
      {/* Results Section */}
      {showResults && poll.results && (
        <div className="results-section" id="results-section">
          <h2>📊 Poll Results</h2>
          <p className="results-subtitle">
            {poll.total_votes === 0 
              ? 'No votes cast yet' 
              : `Based on ${poll.results.total_votes} vote${poll.results.total_votes !== 1 ? 's' : ''}`}
          </p>
          
          <div className="results-list">
            {poll.results.candidates?.map((candidate, index) => {
              const percentage = calculatePercentage(
                candidate.vote_count, 
                poll.results.total_votes
              );
              const isLeading = index === 0 && candidate.vote_count > 0;
              
              return (
                <div key={candidate.candidate_id} className={`result-card ${isLeading ? 'leading' : ''}`}>
                  <div className="result-header">
                    <div className="result-info">
                      <span className="result-rank">#{index + 1}</span>
                      <div>
                        <h3>{candidate.candidate_name}</h3>
                        {candidate.party && (
                          <p className="party-name">{candidate.party}</p>
                        )}
                      </div>
                    </div>
                    <div className="result-stats">
                      <span className="vote-count">{candidate.vote_count} votes</span>
                      <span className="percentage">{percentage}%</span>
                    </div>
                  </div>
                  
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isLeading ? '#28a745' : '#1b5e20'
                      }}
                    >
                      {percentage > 10 && <span className="progress-label">{percentage}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PollDetail;