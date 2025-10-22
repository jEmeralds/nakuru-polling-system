import api from './api';

/**
 * Issues API Service
 * Handles all API calls related to the citizen feedback/issues system
 */
export const issuesAPI = {
  
  // ==================== CATEGORIES ====================
  
  /**
   * Get all issue categories
   * @returns {Promise<Array>} Array of category objects
   */
  getCategories: async () => {
    try {
      const response = await api.get('/issues/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // ==================== ISSUES CRUD ====================

  /**
   * Get all issues with optional filters
   */
  getIssues: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.constituency_id) params.append('constituency_id', filters.constituency_id);
      if (filters.ward_id) params.append('ward_id', filters.ward_id);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await api.get(`/issues?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  },

  /**
   * Get a single issue by ID
   */
  getIssueById: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error;
    }
  },

  /**
   * Create a new issue
   */
  createIssue: async (issueData) => {
    try {
      const response = await api.post('/issues', issueData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  },

  /**
   * Update an issue (admin only)
   */
  updateIssue: async (issueId, updateData) => {
    try {
      const response = await api.put(`/issues/${issueId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  },

  /**
   * Delete an issue (admin only)
   */
  deleteIssue: async (issueId) => {
    try {
      const response = await api.delete(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error;
    }
  },

  // ==================== UPVOTES ====================

  /**
   * Toggle upvote on an issue
   */
  toggleUpvote: async (issueId) => {
    try {
      const response = await api.post(`/issues/${issueId}/upvote`);
      return response.data;
    } catch (error) {
      console.error('Error toggling upvote:', error);
      throw error;
    }
  },

  /**
   * Check if current user has upvoted an issue
   */
  hasUserUpvoted: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}/upvote/status`);
      return response.data.hasUpvoted;
    } catch (error) {
      console.error('Error checking upvote status:', error);
      throw error;
    }
  },

  // ==================== COMMENTS ====================

  /**
   * Get all comments for an issue
   */
  getComments: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Add a comment to an issue
   */
  addComment: async (issueId, commentText) => {
    try {
      const response = await api.post(`/issues/${issueId}/comments`, {
        comment_text: commentText
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Delete a comment (comment author or admin only)
   */
  deleteComment: async (issueId, commentId) => {
    try {
      const response = await api.delete(`/issues/${issueId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // ==================== VIEW COUNTER ====================
  
  /**
   * Increment view count for an issue
   */
  incrementViews: async (issueId) => {
    try {
      const response = await api.post(`/issues/${issueId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  },

  // ==================== ADMIN FUNCTIONS ====================

  /**
   * Update issue status (admin only)
   */
  updateIssueStatus: async (issueId, status) => {
    try {
      const response = await api.put(`/issues/${issueId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw error;
    }
  },

  /**
   * Add admin response to an issue
   */
  addAdminResponse: async (issueId, responseText) => {
    try {
      const response = await api.post(`/issues/${issueId}/admin-response`, {
        response_text: responseText
      });
      return response.data;
    } catch (error) {
      console.error('Error adding admin response:', error);
      throw error;
    }
  },

  /**
   * Get issues statistics (admin only)
   */
  getIssuesStats: async () => {
    try {
      const response = await api.get('/issues/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching issues stats:', error);
      throw error;
    }
  },

  /**
   * Get trending issues (most upvoted in last 7 days)
   */
  getTrendingIssues: async (limit = 10) => {
    try {
      const response = await api.get(`/issues/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending issues:', error);
      throw error;
    }
  },

  // ==================== USER SPECIFIC ====================

  /**
   * Get issues created by current user
   */
  getMyIssues: async () => {
    try {
      const response = await api.get('/issues/my-issues');
      return response.data;
    } catch (error) {
      console.error('Error fetching my issues:', error);
      throw error;
    }
  },

  /**
   * Get issues upvoted by current user
   */
  getMyUpvotedIssues: async () => {
    try {
      const response = await api.get('/issues/my-upvotes');
      return response.data;
    } catch (error) {
      console.error('Error fetching upvoted issues:', error);
      throw error;
    }
  },

  // ==================== GEOGRAPHIC DATA ====================

  /**
   * Get all constituencies
   */
  getConstituencies: async () => {
    try {
      const response = await api.get('/geographic/constituencies');
      return response.data;
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      throw error;
    }
  },

  /**
   * Get wards for a specific constituency
   */
  getWardsByConstituency: async (constituencyId) => {
    try {
      const response = await api.get(`/geographic/constituencies/${constituencyId}/wards`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wards:', error);
      throw error;
    }
  }
};

export default issuesAPI;