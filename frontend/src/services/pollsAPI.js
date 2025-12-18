// =====================================================
// FILE: frontend/src/services/pollsAPI.js
// COMPLETE VERSION - All functions for existing + admin pages
// =====================================================

import api from './api';

// =====================================================
// POLL FUNCTIONS
// =====================================================

/**
 * Get all polls
 */
export const getAllPolls = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.position_type) params.append('position_type', filters.position_type);
    if (filters.active_only) params.append('active_only', 'true');
    
    const queryString = params.toString();
    const url = queryString ? `/polls?${queryString}` : '/polls';
    
    console.log('📊 Fetching polls:', url);
    const response = await api.get(url);
    console.log('✅ Polls fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get polls error:', error);
    throw error;
  }
};

/**
 * Get active polls only
 */
export const getActivePolls = async () => {
  try {
    const response = await api.get('/polls/active');
    return response.data;
  } catch (error) {
    console.error('❌ Get active polls error:', error);
    throw error;
  }
};

/**
 * Get single poll by ID
 */
export const getPollById = async (pollId) => {
  try {
    console.log('📊 Fetching poll:', pollId);
    const response = await api.get(`/polls/${pollId}`);
    console.log('✅ Poll fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get poll by ID error:', error);
    throw error;
  }
};

/**
 * Get poll results
 */
export const getPollResults = async (pollId) => {
  try {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  } catch (error) {
    console.error('❌ Get poll results error:', error);
    throw error;
  }
};

/**
 * Cast a vote
 */
export const castVote = async (pollId, candidateId) => {
  try {
    console.log('🗳️ Casting vote:', { pollId, candidateId });
    const response = await api.post('/polls/vote', {
      pollId,
      candidateId
    });
    console.log('✅ Vote cast:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Cast vote error:', error);
    throw error;
  }
};

/**
 * Check if user can vote (simplified - checks poll details)
 */
export const canVote = async (pollId) => {
  try {
    // Just get the poll details - has_voted is included
    const response = await getPollById(pollId);
    return {
      success: true,
      canVote: !response.poll.has_voted && response.poll.status === 'active'
    };
  } catch (error) {
    console.error('❌ Can vote check error:', error);
    return { success: false, canVote: false };
  }
};

// =====================================================
// ADMIN POLL FUNCTIONS
// =====================================================

/**
 * Create a new poll (Admin only)
 */
export const createPoll = async (pollData) => {
  try {
    console.log('📝 Creating poll:', pollData);
    const response = await api.post('/polls', pollData);
    console.log('✅ Poll created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Create poll error:', error);
    throw error;
  }
};

/**
 * Update poll status (Admin only)
 */
export const updatePollStatus = async (pollId, status) => {
  try {
    console.log('📝 Updating poll status:', pollId, status);
    const response = await api.patch(`/polls/${pollId}/status`, { status });
    console.log('✅ Poll status updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Update poll status error:', error);
    throw error;
  }
};

/**
 * Delete a poll (Admin only)
 */
export const deletePoll = async (pollId) => {
  try {
    console.log('🗑️ Deleting poll:', pollId);
    const response = await api.delete(`/polls/${pollId}`);
    console.log('✅ Poll deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Delete poll error:', error);
    throw error;
  }
};

// =====================================================
// CANDIDATE FUNCTIONS
// =====================================================

/**
 * Get candidates for a specific poll
 */
export const getCandidatesByPoll = async (pollId) => {
  try {
    console.log('👥 Fetching candidates for poll:', pollId);
    const response = await api.get(`/candidates?poll_id=${pollId}`);
    console.log('✅ Candidates fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get candidates by poll error:', error);
    throw error;
  }
};

/**
 * Create a new candidate (Admin only)
 */
export const createCandidate = async (candidateData) => {
  try {
    console.log('👤 Creating candidate:', candidateData);
    const response = await api.post('/candidates', candidateData);
    console.log('✅ Candidate created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Create candidate error:', error);
    throw error;
  }
};

/**
 * Delete a candidate (Admin only)
 */
export const deleteCandidate = async (candidateId) => {
  try {
    console.log('🗑️ Deleting candidate:', candidateId);
    const response = await api.delete(`/candidates/${candidateId}`);
    console.log('✅ Candidate deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Delete candidate error:', error);
    throw error;
  }
};

// =====================================================
// UTILITY FUNCTIONS (Required by Polls.js and PollDetail.js)
// =====================================================

/**
 * Get status color
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
 * Get position label
 */
export const getPositionLabel = (positionType) => {
  const labels = {
    president: 'President',
    governor: 'Governor',
    senator: 'Senator',
    mp: 'Member of Parliament',
    woman_rep: 'Woman Representative',
    mca: 'Member of County Assembly'
  };
  return labels[positionType] || positionType;
};

/**
 * Calculate time remaining
 */
export const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  return 'Less than 1 minute remaining';
};

/**
 * Format poll for display
 */
export const formatPoll = (poll) => {
  if (!poll) return null;
  
  return {
    ...poll,
    start_date: new Date(poll.start_date),
    end_date: new Date(poll.end_date),
    is_active: poll.status === 'active',
    is_closed: poll.status === 'closed',
    time_remaining: getTimeRemaining(poll.end_date),
    position_label: getPositionLabel(poll.position_type),
    status_color: getStatusColor(poll.status)
  };
};

// =====================================================
// EXPORT AS OBJECT
// =====================================================

export const pollsAPI = {
  // Poll functions
  getAllPolls,
  getActivePolls,
  getPollById,
  getPollResults,
  castVote,
  canVote,
  
  // Admin poll functions
  createPoll,
  updatePollStatus,
  deletePoll,
  
  // Candidate functions
  getCandidatesByPoll,
  createCandidate,
  deleteCandidate,
  
  // Utility functions
  getStatusColor,
  getPositionLabel,
  getTimeRemaining,
  formatPoll
};

export default pollsAPI;