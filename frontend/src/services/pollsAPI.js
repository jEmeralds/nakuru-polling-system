// =====================================================
// FILE: frontend/src/services/pollsAPI.js
// Frontend service for polls API calls
// =====================================================

import api from './api';

// =====================================================
// PUBLIC POLL FUNCTIONS
// =====================================================

/**
 * Get all active polls (public access)
 * @param {Object} filters - Optional filters
 * @returns {Promise} Array of active polls
 */
export const getActivePolls = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.position_type) params.append('position_type', filters.position_type);
    if (filters.location_level) params.append('location_level', filters.location_level);
    
    const response = await api.get(`/polls/active?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get active polls error:', error);
    throw error;
  }
};

/**
 * Get all polls with filters (authenticated)
 * @param {Object} filters - Filter options
 * @returns {Promise} Array of polls
 */
export const getAllPolls = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.position_type) params.append('position_type', filters.position_type);
    if (filters.active_only) params.append('active_only', filters.active_only);
    
    const response = await api.get(`/polls?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get all polls error:', error);
    throw error;
  }
};

/**
 * Get single poll by ID
 * @param {String} pollId - Poll UUID
 * @returns {Promise} Poll details with options and results
 */
export const getPollById = async (pollId) => {
  try {
    const response = await api.get(`/polls/${pollId}`);
    return response.data;
  } catch (error) {
    console.error('Get poll by ID error:', error);
    throw error;
  }
};

/**
 * Get poll results
 * @param {String} pollId - Poll UUID
 * @returns {Promise} Poll results with vote counts
 */
export const getPollResults = async (pollId) => {
  try {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  } catch (error) {
    console.error('Get poll results error:', error);
    throw error;
  }
};

/**
 * Cast a vote in a poll
 * @param {String} pollId - Poll UUID
 * @param {String} optionId - Option UUID
 * @returns {Promise} Vote confirmation with results
 */
export const castVote = async (pollId, optionId) => {
  try {
    const response = await api.post('/polls/vote', {
      pollId,
      optionId
    });
    return response.data;
  } catch (error) {
    console.error('Cast vote error:', error);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error(error.response.data.error || 'Invalid vote');
      } else if (error.response.status === 429) {
        throw new Error('Please wait before voting again');
      }
    }
    
    throw new Error('Failed to cast vote. Please try again.');
  }
};

// =====================================================
// ADMIN POLL FUNCTIONS
// =====================================================

/**
 * Create a new poll (admin only)
 * @param {Object} pollData - Poll creation data
 * @returns {Promise} Created poll
 */
export const createPoll = async (pollData) => {
  try {
    const response = await api.post('/polls', pollData);
    return response.data;
  } catch (error) {
    console.error('Create poll error:', error);
    throw error;
  }
};

/**
 * Update poll status (admin only)
 * @param {String} pollId - Poll UUID
 * @param {String} status - New status (draft/active/closed/cancelled)
 * @returns {Promise} Updated poll
 */
export const updatePollStatus = async (pollId, status) => {
  try {
    const response = await api.patch(`/polls/${pollId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update poll status error:', error);
    throw error;
  }
};

/**
 * Delete a poll (admin only)
 * @param {String} pollId - Poll UUID
 * @returns {Promise} Success confirmation
 */
export const deletePoll = async (pollId) => {
  try {
    const response = await api.delete(`/polls/${pollId}`);
    return response.data;
  } catch (error) {
    console.error('Delete poll error:', error);
    throw error;
  }
};

/**
 * Get fraud alerts (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise} Array of fraud alerts
 */
export const getFraudAlerts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.pollId) params.append('pollId', filters.pollId);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get(`/polls/admin/fraud-alerts?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    throw error;
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format poll for display
 * @param {Object} poll - Raw poll data
 * @returns {Object} Formatted poll
 */
export const formatPoll = (poll) => {
  return {
    ...poll,
    start_date: new Date(poll.start_date),
    end_date: new Date(poll.end_date),
    is_active: poll.status === 'active' && 
               new Date() >= new Date(poll.start_date) && 
               new Date() <= new Date(poll.end_date),
    time_remaining: getTimeRemaining(poll.end_date),
    participation_rate: poll.total_votes > 0 ? 
      ((poll.total_votes / 1000) * 100).toFixed(1) : 0 // Assuming 1000 potential voters
  };
};

/**
 * Calculate time remaining for a poll
 * @param {String} endDate - Poll end date
 * @returns {Object} Time remaining object
 */
export const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) {
    return { expired: true, text: 'Poll closed' };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return { expired: false, text: `${days} day${days > 1 ? 's' : ''} remaining` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours} hour${hours > 1 ? 's' : ''} remaining` };
  } else {
    return { expired: false, text: `${minutes} minute${minutes > 1 ? 's' : ''} remaining` };
  }
};

/**
 * Get position type label
 * @param {String} positionType - Position type code
 * @returns {String} Formatted label
 */
export const getPositionLabel = (positionType) => {
  const labels = {
    president: 'President',
    governor: 'Governor',
    senator: 'Senator',
    mp: 'Member of Parliament',
    woman_rep: 'Woman Representative',
    mca: 'Member of County Assembly',
    other: 'Other'
  };
  return labels[positionType] || positionType;
};

/**
 * Get status badge color
 * @param {String} status - Poll status
 * @returns {String} CSS color class
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: '#6c757d',
    active: '#28a745',
    closed: '#dc3545',
    cancelled: '#ffc107'
  };
  return colors[status] || '#6c757d';
};

/**
 * Check if user can vote in poll
 * @param {Object} poll - Poll object
 * @param {Object} user - User object
 * @returns {Object} Can vote result with reason
 */
export const canVote = (poll, user) => {
  // Check if poll is active
  if (poll.status !== 'active') {
    return { canVote: false, reason: 'Poll is not active' };
  }
  
  // Check if poll has started
  if (new Date() < new Date(poll.start_date)) {
    return { canVote: false, reason: 'Poll has not started yet' };
  }
  
  // Check if poll has ended
  if (new Date() > new Date(poll.end_date)) {
    return { canVote: false, reason: 'Poll has ended' };
  }
  
  // Check if user has already voted
  if (poll.has_voted) {
    return { canVote: false, reason: 'You have already voted' };
  }
  
  // Check location verification if required
  if (poll.require_location_verification && poll.target_location) {
    const targetLevel = poll.target_location.level;
    
    if (targetLevel === 'county' && user.county !== poll.target_location.county_name) {
      return { canVote: false, reason: 'This poll is not available in your county' };
    }
    
    if (targetLevel === 'constituency' && user.constituency !== poll.target_location.constituency_name) {
      return { canVote: false, reason: 'This poll is not available in your constituency' };
    }
  }
  
  return { canVote: true, reason: null };
};

// Export all functions
export default {
  // Public functions
  getActivePolls,
  getAllPolls,
  getPollById,
  getPollResults,
  castVote,
  
  // Admin functions
  createPoll,
  updatePollStatus,
  deletePoll,
  getFraudAlerts,
  
  // Helper functions
  formatPoll,
  getTimeRemaining,
  getPositionLabel,
  getStatusColor,
  canVote
};