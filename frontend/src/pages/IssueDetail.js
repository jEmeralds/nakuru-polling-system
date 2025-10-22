// frontend/src/pages/IssueDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issuesAPI } from '../services/issuesAPI';
import './IssueDetail.css';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState(null);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchIssueDetails();
    fetchComments();
    incrementViewCount();
  }, [id]);

  const incrementViewCount = async () => {
    try {
      await issuesAPI.incrementViews(id);
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const data = await issuesAPI.getIssueById(id);
      setIssue(data.issue);
      setError(null);
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const data = await issuesAPI.getComments(id);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpvote = async () => {
    if (upvoting) return;
    
    try {
      setUpvoting(true);
      await issuesAPI.toggleUpvote(id);
      setUpvoted(!upvoted);
      
      // Update local count
      setIssue(prev => ({
        ...prev,
        upvotes_count: upvoted ? prev.upvotes_count - 1 : prev.upvotes_count + 1
      }));
    } catch (err) {
      console.error('Error upvoting:', err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await issuesAPI.addComment(id, commentText);
      setCommentText('');
      
      // Refresh comments to show new one
      await fetchComments();
      
      // Update comment count
      setIssue(prev => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#2196F3',
      'under review': '#FF9800',
      'in progress': '#9C27B0',
      resolved: '#4CAF50',
      rejected: '#F44336'
    };
    return colors[status] || '#757575';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="issue-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="issue-detail-container">
        <div className="error-state">
          <p>⚠️ {error || 'Issue not found'}</p>
          <button onClick={() => navigate('/issues')} className="back-btn">
            ← Back to Issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-detail-container">
      {/* Back Button */}
      <button onClick={() => navigate('/issues')} className="back-link">
        ← Back to Issues
      </button>

      {/* Issue Header */}
      <div className="issue-header">
        <div className="header-top">
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(issue.status) }}
          >
            {issue.status.toUpperCase()}
          </div>
          
          {issue.is_anonymous && (
            <div className="anonymous-badge">
              🎭 Anonymous
            </div>
          )}
        </div>

        <h1 className="issue-title">{issue.title}</h1>

        <div className="issue-meta">
          <span className="meta-item">
            📅 {formatDate(issue.created_at)}
          </span>
          {issue.location_description && (
            <span className="meta-item">
              📍 {issue.location_description}
            </span>
          )}
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <button 
            className={`stat-button ${upvoted ? 'active' : ''}`}
            onClick={handleUpvote}
            disabled={upvoting}
          >
            <span className="stat-icon">👍</span>
            <span className="stat-value">{issue.upvotes_count || 0}</span>
            <span className="stat-label">Upvotes</span>
          </button>

          <div className="stat-item">
            <span className="stat-icon">💬</span>
            <span className="stat-value">{comments.length}</span>
            <span className="stat-label">Comments</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon">👁️</span>
            <span className="stat-value">{issue.views_count || 0}</span>
            <span className="stat-label">Views</span>
          </div>
        </div>
      </div>

      {/* Issue Content */}
      <div className="issue-content">
        <h2>Description</h2>
        <p className="issue-description">{issue.description}</p>
      </div>

      {/* Admin Response */}
      {issue.admin_response && (
        <div className="admin-response">
          <h3>🏛️ Official Response</h3>
          <p>{issue.admin_response}</p>
          {issue.admin_response_at && (
            <span className="response-date">
              Responded on {formatDate(issue.admin_response_at)}
            </span>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="comments-section">
        <h2>💬 Comments ({comments.length})</h2>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            maxLength={500}
            className="comment-textarea"
          />
          <div className="comment-form-footer">
            <span className="char-count">{commentText.length}/500</span>
            <button 
              type="submit" 
              className="submit-comment-btn"
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        {loadingComments ? (
          <div className="loading-comments">
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <span className="author-icon">👤</span>
                    <span className="author-name">
                      {comment.users?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="comment-time">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <div className="comment-body">
                  <p>{comment.comment_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetail;