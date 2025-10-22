// frontend/src/pages/admin/AdminIssues.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminAPI from '../../services/adminAPI';
import './AdminIssues.css';

const AdminIssues = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    category_id: 'all',
    priority: 'all',
    sort: 'newest'
  });

  useEffect(() => {
    // Check if user is admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/dashboard');
      return;
    }

    fetchData();
  }, [user, navigate, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch issues with filters
      const issuesRes = await adminAPI.getAllIssues(filters);
      
      if (issuesRes.data.success) {
        setIssues(issuesRes.data.issues);
      }

      // Fetch categories (if not already loaded)
      if (categories.length === 0) {
        const categoriesRes = await fetch('http://localhost:3001/api/issues/categories');
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      }

    } catch (error) {
      console.error('Error fetching admin issues:', error);
      alert('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const response = await adminAPI.updateIssueStatus(issueId, newStatus);
      
      if (response.data.success) {
        // Update local state
        setIssues(issues.map(issue => 
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        ));
        alert(`Status updated to "${newStatus}"`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handlePriorityChange = async (issueId, newPriority) => {
    try {
      const response = await adminAPI.updateIssuePriority(issueId, newPriority);
      
      if (response.data.success) {
        // Update local state
        setIssues(issues.map(issue => 
          issue.id === issueId ? { ...issue, priority: newPriority } : issue
        ));
        alert(`Priority updated to "${newPriority}"`);
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority');
    }
  };

  const openResponseModal = (issue) => {
    setSelectedIssue(issue);
    setAdminResponse(issue.admin_response || '');
    setShowModal(true);
  };

  const handleAddResponse = async () => {
    if (!adminResponse.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      const response = await adminAPI.addAdminResponse(selectedIssue.id, adminResponse);
      
      if (response.data.success) {
        // Update local state
        setIssues(issues.map(issue => 
          issue.id === selectedIssue.id 
            ? { ...issue, admin_response: adminResponse, admin_response_at: new Date().toISOString() } 
            : issue
        ));
        setShowModal(false);
        setSelectedIssue(null);
        setAdminResponse('');
        alert('Admin response added successfully!');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': '#3b82f6',
      'under review': '#f59e0b',
      'in progress': '#8b5cf6',
      'resolved': '#10b981',
      'rejected': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#f97316',
      'urgent': '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="admin-issues-container">
        <div className="loading">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="admin-issues-container">
      {/* Header */}
      <div className="admin-issues-header">
        <div>
          <h1>🎯 Issue Management</h1>
          <p>Manage and respond to community issues</p>
        </div>
        <button 
          className="back-btn"
          onClick={() => navigate('/admin')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under review">Under Review</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select 
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort:</label>
          <select 
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_upvoted">Most Upvoted</option>
            <option value="most_viewed">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Issues Count */}
      <div className="issues-count">
        Showing {issues.length} issue{issues.length !== 1 ? 's' : ''}
      </div>

      {/* Issues Table */}
      <div className="admin-issues-table">
        <table>
          <thead>
            <tr>
              <th>Issue</th>
              <th>Category</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Stats</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-issues">
                  No issues found matching the filters
                </td>
              </tr>
            ) : (
              issues.map(issue => (
                <tr key={issue.id}>
                  <td className="issue-title-cell">
                    <div 
                      className="issue-title-link"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                    >
                      {issue.title}
                    </div>
                    {issue.admin_response && (
                      <span className="has-response-badge">✓ Responded</span>
                    )}
                  </td>
                  
                  <td>
                    <span className="category-badge">
                      {issue.issue_categories?.icon} {issue.issue_categories?.name}
                    </span>
                  </td>
                  
                  <td>
                    {issue.is_anonymous ? (
                      <span className="anonymous-badge">Anonymous</span>
                    ) : (
                      <div className="user-info">
                        <div>{issue.users?.full_name || 'Unknown'}</div>
                        <div className="user-phone">{issue.users?.phone_number}</div>
                      </div>
                    )}
                  </td>
                  
                  <td>
                    <select 
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className="status-select"
                      style={{ backgroundColor: getStatusColor(issue.status) }}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under review">Under Review</option>
                      <option value="in progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  
                  <td>
                    <select 
                      value={issue.priority || 'medium'}
                      onChange={(e) => handlePriorityChange(issue.id, e.target.value)}
                      className="priority-select"
                      style={{ backgroundColor: getPriorityColor(issue.priority) }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </td>
                  
                  <td>
                    <div className="issue-stats">
                      <span>👍 {issue.upvotes_count || 0}</span>
                      <span>👁️ {issue.views_count || 0}</span>
                      <span>💬 {issue.comments_count || 0}</span>
                    </div>
                  </td>
                  
                  <td>
                    {new Date(issue.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  
                  <td>
                    <button 
                      className="action-btn response-btn"
                      onClick={() => openResponseModal(issue)}
                      title="Add/Edit Admin Response"
                    >
                      💬
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Response Modal */}
      {showModal && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Admin Response</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="issue-summary">
                <h3>{selectedIssue.title}</h3>
                <p>{selectedIssue.description}</p>
              </div>
              
              <div className="response-form">
                <label>Your Response:</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to this issue..."
                  rows="6"
                />
              </div>

              {selectedIssue.admin_response_at && (
                <div className="previous-response-info">
                  Last updated: {new Date(selectedIssue.admin_response_at).toLocaleString()}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-btn"
                onClick={handleAddResponse}
              >
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssues;