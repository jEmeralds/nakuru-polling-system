import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/issuesAPI';
import './Issues.css';

const Issues = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchIssues();
  }, []);

  // Fetch issues when filters change
  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories...');
      setCategoriesLoading(true);
      const data = await issuesAPI.getCategories();
      console.log('✅ Categories fetched:', data);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchIssues = async () => {
  try {
    console.log('🔍 Fetching issues...');
    setLoading(true);
    const filters = {};
    
    if (selectedCategory !== 'all') filters.category_id = selectedCategory;
    if (selectedStatus !== 'all') filters.status = selectedStatus;
    if (searchQuery) filters.search = searchQuery;
    
    const data = await issuesAPI.getIssues(filters);
    console.log('✅ Issues fetched:', data);
    setIssues(data.issues || []);
    setError(null);
  } catch (err) {
    console.error('❌ Error fetching issues:', err);
    setError('Failed to load issues');
    setIssues([]);
  } finally {
    setLoading(false);
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
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Roads & Infrastructure': '🛣️',
      'Water & Sanitation': '💧',
      'Healthcare': '🏥',
      'Education': '📚',
      'Security': '🚨',
      'Environment': '🌳',
      'Public Transport': '🚌',
      'Street Lighting': '💡',
      'Waste Management': '♻️',
      'Employment': '💼',
      'Youth Programs': '👥',
      'Other': '📝'
    };
    return icons[categoryName] || '📋';
  };

  return (
    <div className="issues-page">
      <div className="issues-container">
        {/* Header */}
        <div className="issues-header">
          <div className="header-content">
            <h1>📝 Community Issues & Feedback</h1>
            <p>Report issues, track progress, and make Nakuru better together</p>
          </div>
          {/* ✅ FIXED: Changed from /issues/submit to /submit-issue */}
          <button 
            className="submit-issue-btn"
            onClick={() => navigate('/submit-issue')}
          >
            ➕ Submit New Issue
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search issues by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="filters-section">
          <h3>Filter by Category</h3>
          <div className="category-filters">
            <button
              className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                console.log('🖱️ All Categories clicked!');
                setSelectedCategory('all');
              }}
            >
              All Categories
            </button>
            
            {categoriesLoading ? (
              <div style={{ padding: '10px', color: '#666' }}>Loading categories...</div>
            ) : categories && categories.length > 0 ? (
              categories.map(category => (
                <button
                  key={category.id}
                  className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : '#f5f7fa',
                    color: selectedCategory === category.id ? 'white' : '#333',
                    border: `2px solid ${category.color}`
                  }}
                  onClick={() => {
                    console.log('🖱️ Category clicked:', category.name);
                    setSelectedCategory(category.id);
                  }}
                >
                  <span className="category-icon">{getCategoryIcon(category.name)}</span>
                  {category.name}
                </button>
              ))
            ) : (
              <div style={{ padding: '10px', color: '#999' }}>No categories available</div>
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div className="status-filters-section">
          <h3>Filter by Status</h3>
          <div className="status-filters">
            {['all', 'submitted', 'under review', 'in progress', 'resolved'].map(status => (
              <button
                key={status}
                className={`status-filter-btn ${selectedStatus === status ? 'active' : ''}`}
                style={{
                  backgroundColor: selectedStatus === status ? getStatusColor(status) : '#f5f7fa',
                  color: selectedStatus === status ? 'white' : '#333'
                }}
                onClick={() => {
                  console.log('🖱️ Status clicked:', status);
                  setSelectedStatus(status);
                }}
              >
                {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Issues Count */}
        <div className="issues-stats">
          <p>{issues.length} issue{issues.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading issues...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={fetchIssues} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && issues.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No issues found</h2>
            <p>
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Be the first to report an issue in your community!'}
            </p>
            {/* ✅ FIXED: Changed from /issues/submit to /submit-issue */}
            <button 
              className="submit-issue-btn"
              onClick={() => navigate('/submit-issue')}
            >
              ➕ Submit First Issue
            </button>
          </div>
        )}
{/* Issues Grid */}
{!loading && !error && issues.length > 0 && (
  <div className="issues-grid">
    {issues.map(issue => (
      <div 
        key={issue.id} 
        className="issue-card"
        onClick={() => navigate(`/issues/${issue.id}`)}
      >
        {/* Status Badge */}
        <div 
          className="issue-status-badge"
          style={{ 
            backgroundColor: getStatusColor(issue.status),
            color: 'white'
          }}
        >
          {issue.status.toUpperCase()}
        </div>

        {/* Issue Content */}
        <h3 className="issue-title">{issue.title}</h3>
        <p className="issue-description">
          {issue.description && issue.description.length > 150 
            ? `${issue.description.substring(0, 150)}...` 
            : issue.description}
        </p>

        {/* Location */}
        {issue.location_description && (
          <div className="issue-location">
            <span className="location-icon">📍</span>
            <span>{issue.location_description}</span>
          </div>
        )}

        {/* Issue Footer */}
        <div className="issue-footer">
          <div className="issue-stats">
            <div className="stat-item upvote">
              <svg className="stat-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 9h3v12H2zm19 11h-9.5a1 1 0 01-.97-.757l-.853-3.764a1 1 0 01.145-.837l4.24-6.5A1 1 0 0115 7.5V4a2 2 0 114 0v6h3a2 2 0 012 2v7a2 2 0 01-2 2z"/>
              </svg>
              <span>{issue.upvotes_count || 0}</span>
            </div>
            
            <div className="stat-item comment">
              <svg className="stat-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <span>{issue.comments_count || 0}</span>
            </div>
            
            <div className="stat-item view">
              <svg className="stat-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span>{issue.views_count || 0}</span>
            </div>
          </div>
          
          <div className="issue-date">
            {formatDate(issue.created_at)}
          </div>
        </div>
        
        {issue.is_anonymous && (
          <div className="anonymous-indicator">
            🎭 Anonymous
          </div>
        )}
      </div>
    ))}
  </div>
)}

      </div>
    </div>
  );
}

export default Issues;