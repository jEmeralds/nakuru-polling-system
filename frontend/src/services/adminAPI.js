// frontend/src/services/adminAPI.js
import api from './api';

const adminAPI = {
  // STATISTICS
  getStats: () => api.get('/admin/stats'),
  getIssueStats: () => api.get('/admin/stats/issues'),

  // ISSUE MANAGEMENT
  getAllIssues: (filters = {}) => api.get('/admin/issues', { params: filters }),
  getIssueById: (issueId) => api.get(`/admin/issues/${issueId}`),
  updateIssueStatus: (issueId, status) => api.put(`/admin/issues/${issueId}/status`, { status }),
  addAdminResponse: (issueId, response) => api.put(`/admin/issues/${issueId}/response`, { response }),
  updateIssuePriority: (issueId, priority) => api.put(`/admin/issues/${issueId}/priority`, { priority }),

  // USER MANAGEMENT
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status })
};

export default adminAPI;