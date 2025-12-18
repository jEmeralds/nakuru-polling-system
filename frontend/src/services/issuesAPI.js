// =====================================================
// FILE: frontend/src/services/issuesAPI.js
// FIXED - Corrected comment endpoint paths
// =====================================================

import api from './api';

/**
 * Get all issue categories
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/issues/categories');
    return response.data;
  } catch (error) {
    console.error('Get categories error:', error);
    throw error;
  }
};

/**
 * Get all issues with optional filters
 */
export const getIssues = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/issues?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get issues error:', error);
    throw error;
  }
};

/**
 * Get single issue by ID
 */
export const getIssueById = async (issueId) => {
  try {
    const response = await api.get(`/issues/${issueId}`);
    return response.data;
  } catch (error) {
    console.error('Get issue by ID error:', error);
    throw error;
  }
};

/**
 * Get comments for an issue
 * ✅ FIXED - Corrected endpoint path
 */
export const getComments = async (issueId) => {
  try {
    console.log('📝 Fetching comments for issue:', issueId);
    const response = await api.get(`/issues/${issueId}/comments`);
    console.log('✅ Comments response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Create a new issue
 */
export const createIssue = async (issueData) => {
  try {
    const response = await api.post('/issues', issueData);
    return response.data;
  } catch (error) {
    console.error('Create issue error:', error);
    throw error;
  }
};

/**
 * Update issue status (admin only)
 */
export const updateIssueStatus = async (issueId, status) => {
  try {
    const response = await api.put(`/issues/${issueId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update issue status error:', error);
    throw error;
  }
};

/**
 * Toggle upvote on an issue
 */
export const toggleUpvote = async (issueId) => {
  try {
    const response = await api.post(`/issues/${issueId}/upvote`);
    return response.data;
  } catch (error) {
    console.error('Toggle upvote error:', error);
    throw error;
  }
};

/**
 * Add a comment to an issue
 * ✅ FIXED - Corrected endpoint path
 */
export const addComment = async (issueId, commentText) => {
  try {
    console.log('💬 Adding comment to issue:', issueId);
    const response = await api.post(`/issues/${issueId}/comments`, {
      comment_text: commentText
    });
    console.log('✅ Comment added:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Increment view count for an issue
 */
export const incrementViews = async (issueId) => {
  try {
    const response = await api.post(`/issues/${issueId}/view`);
    return response.data;
  } catch (error) {
    console.error('Increment views error:', error);
    throw error;
  }
};

// Export as object
export const issuesAPI = {
  getCategories,
  getIssues,
  getIssueById,
  getComments,
  createIssue,
  updateIssueStatus,
  toggleUpvote,
  addComment,
  incrementViews
};

export default issuesAPI;