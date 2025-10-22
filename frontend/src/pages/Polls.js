// =====================================================
// FILE: frontend/src/pages/Polls.js
// Polls listing page with filters
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPolls, getPositionLabel, getStatusColor, getTimeRemaining } from '../services/pollsAPI';
import './Polls.css';

const Polls = () => {
  const navigate = useNavigate();
  
  // State management
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Position types for filter
  const positionTypes = [
    { value: 'all', label: 'All Positions' },
    { value: 'president', label: '🇰🇪 President', icon: '🇰🇪' },
    { value: 'governor', label: '🏛️ Governor', icon: '🏛️' },
    { value: 'senator', label: '⚖️ Senator', icon: '⚖️' },
    { value: 'mp', label: '📋 MP', icon: '📋' },
    { value: 'woman_rep', label: '👩 Woman Rep', icon: '👩' },
    { value: 'mca', label: '🏘️ MCA', icon: '🏘️' }
  ];
  
  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', color: '#28a745' },
    { value: 'closed', label: 'Closed', color: '#dc3545' },
    { value: 'draft', label: 'Draft', color: '#6c757d' }
  ];
  
  // Fetch polls on component mount
  useEffect(() => {
    fetchPolls();
  }, []);
  
  // Apply filters when polls or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [polls, statusFilter, positionFilter, searchQuery]);
  
  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await getAllPolls();
      setPolls(data.polls || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...polls];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(poll => poll.status === statusFilter);
    }
    
    // Filter by position
    if (positionFilter !== 'all') {
      filtered = filtered.filter(poll => poll.position_type === positionFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(query) ||
        poll.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredPolls(filtered);
  };
  
  const handlePollClick = (pollId) => {
    navigate(`/polls/${pollId}`);
  };
  
  const getPollCardClass = (poll) => {
    const now = new Date();
    const endDate = new Date(poll.end_date);
    
    if (poll.status === 'active' && now < endDate) {
      return 'poll-card active';
    } else if (poll.status === 'closed' || now > endDate) {
      return 'poll-card closed';
    } else {
      return 'poll-card draft';
    }
  };
  
  return (
    <div className="polls-container">
      {/* Header */}
      <div className="polls-header">
        <h1>🗳️ Election Polls</h1>
        <p>Participate in opinion polls for upcoming elections</p>
      </div>
      
      {/* Filters Section */}
      <div className="polls-filters">
        {/* Search Bar */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Position Filter Buttons */}
        <div className="position-filters">
          {positionTypes.map(position => (
            <button
              key={position.value}
              onClick={() => setPositionFilter(position.value)}
              className={`filter-btn ${positionFilter === position.value ? 'active' : ''}`}
            >
              {position.icon && <span className="filter-icon">{position.icon}</span>}
              {position.label}
            </button>
          ))}
        </div>
        
        {/* Status Filter Buttons */}
        <div className="status-filters">
          {statusOptions.map(status => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`status-btn ${statusFilter === status.value ? 'active' : ''}`}
              style={{
                borderColor: statusFilter === status.value ? status.color : '#ddd'
              }}
            >
              {status.label}
              {statusFilter === status.value && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredPolls.length}</strong> poll{filteredPolls.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading polls...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="error-state">
          <p className="error-message">⚠️ {error}</p>
          <button onClick={fetchPolls} className="retry-btn">
            Try Again
          </button>
        </div>
      )}
      
      {/* Polls Grid */}
      {!loading && !error && (
        <>
          {filteredPolls.length > 0 ? (
            <div className="polls-grid">
              {filteredPolls.map(poll => {
                const timeRemaining = getTimeRemaining(poll.end_date);
                const positionLabel = getPositionLabel(poll.position_type);
                
                return (
                  <div
                    key={poll.id}
                    className={getPollCardClass(poll)}
                    onClick={() => handlePollClick(poll.id)}
                  >
                    {/* Status Badge */}
                    <div className="poll-status-badge" style={{ backgroundColor: getStatusColor(poll.status) }}>
                      {poll.status.toUpperCase()}
                    </div>
                    
                    {/* Poll Header */}
                    <div className="poll-card-header">
                      <h3>{poll.title}</h3>
                      <p className="poll-position">{positionLabel}</p>
                    </div>
                    
                    {/* Poll Description */}
                    {poll.description && (
                      <p className="poll-description">
                        {poll.description.length > 150
                          ? `${poll.description.substring(0, 150)}...`
                          : poll.description}
                      </p>
                    )}
                    
                    {/* Poll Stats */}
                    <div className="poll-stats">
                      <div className="stat">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{poll.total_votes || 0}</span>
                        <span className="stat-label">Votes</span>
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">📊</span>
                        <span className="stat-value">{poll.poll_options?.length || 0}</span>
                        <span className="stat-label">Options</span>
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">⏰</span>
                        <span className="stat-value time-remaining">
                          {timeRemaining.text}
                        </span>
                      </div>
                    </div>
                    
                    {/* Location Info */}
                    {poll.target_location && (
                      <div className="poll-location">
                        <span className="location-icon">📍</span>
                        <span>
                          {poll.target_location.level === 'national' ? 'National' :
                           poll.target_location.level === 'county' ? poll.target_location.county_name :
                           poll.target_location.level === 'constituency' ? poll.target_location.constituency_name :
                           poll.target_location.level}
                        </span>
                      </div>
                    )}
                    
                    {/* Vote Button */}
                    <button className="vote-btn">
                      {poll.has_voted ? '✓ Voted' : 'Vote Now →'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🗳️</div>
              <h3>No polls found</h3>
              <p>
                {searchQuery
                  ? `No polls match your search for "${searchQuery}"`
                  : 'There are no polls matching your filters'}
              </p>
              <button onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPositionFilter('all');
              }} className="reset-filters-btn">
                Clear Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Polls;