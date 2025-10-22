import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/issuesAPI';
import './SubmitIssue.css';

const SubmitIssue = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    constituency_id: '',
    ward_id: '',
    is_anonymous: false
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchConstituencies();
  }, []);

  useEffect(() => {
    if (formData.constituency_id) {
      fetchWards(formData.constituency_id);
    } else {
      setWards([]);
      setFormData(prev => ({ ...prev, ward_id: '' }));
    }
  }, [formData.constituency_id]);

  const fetchCategories = async () => {
    try {
      const data = await issuesAPI.getCategories();
     setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchConstituencies = async () => {
    try {
      // Try to fetch from API first
      const data = await issuesAPI.getConstituencies();
      setConstituencies(data);
    } catch (err) {
      console.error('Error fetching constituencies:', err);
      // Fallback to hardcoded Nakuru constituencies if API fails
      setConstituencies([
        { id: 1, name: 'Nakuru Town East' },
        { id: 2, name: 'Nakuru Town West' },
        { id: 3, name: 'Bahati' },
        { id: 4, name: 'Gilgil' },
        { id: 5, name: 'Kuresoi North' },
        { id: 6, name: 'Kuresoi South' },
        { id: 7, name: 'Molo' },
        { id: 8, name: 'Naivasha' },
        { id: 9, name: 'Njoro' },
        { id: 10, name: 'Rongai' },
        { id: 11, name: 'Subukia' }
      ]);
    }
  };

  const fetchWards = async (constituencyId) => {
    try {
      // Try to fetch from API
      const data = await issuesAPI.getWardsByConstituency(constituencyId);
      setWards(data);
    } catch (err) {
      console.error('Error fetching wards:', err);
      // Fallback to empty or sample wards if API fails
      setWards([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (formData.description.length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
    }

    if (!formData.category_id) {
      errors.category_id = 'Please select a category';
    }

    if (!formData.constituency_id) {
      errors.constituency_id = 'Please select a constituency';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const issueData = {
        ...formData,
        ward_id: formData.ward_id || null
      };

      const newIssue = await issuesAPI.createIssue(issueData);
      
      setSuccess(true);
      
      // Redirect to issue detail page after 2 seconds
      setTimeout(() => {
        navigate(`/issues/${newIssue.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting issue:', err);
      setError(err.response?.data?.message || 'Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/issues');
    }
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

  if (success) {
    return (
      <div className="submit-issue-page">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1>Issue Submitted Successfully!</h1>
          <p>Thank you for making Nakuru better. Your issue has been recorded and will be reviewed by our team.</p>
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark draw"></div>
            </div>
          </div>
          <p className="redirect-message">Redirecting to your issue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-issue-page">
      <div className="submit-issue-container">
        {/* Header */}
        <div className="submit-header">
          <button className="back-btn" onClick={() => navigate('/issues')}>
            ← Back to Issues
          </button>
          <h1>📝 Submit New Issue</h1>
          <p>Help us improve Nakuru by reporting issues in your community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="issue-form">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Issue Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Issue Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-input ${formErrors.title ? 'error' : ''}`}
              placeholder="e.g., Pothole on Main Street near Market"
              value={formData.title}
              onChange={handleChange}
              maxLength={200}
            />
            {formErrors.title && (
              <span className="error-message">{formErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label htmlFor="category_id" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              className={`form-select ${formErrors.category_id ? 'error' : ''}`}
              value={formData.category_id}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {getCategoryIcon(category.name)} {category.name}
                </option>
              ))}
            </select>
            {formErrors.category_id && (
              <span className="error-message">{formErrors.category_id}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Detailed Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={`form-textarea ${formErrors.description ? 'error' : ''}`}
              placeholder="Describe the issue in detail. Include when it started, how it affects you, and any other relevant information..."
              value={formData.description}
              onChange={handleChange}
              rows={6}
              maxLength={2000}
            />
            {formErrors.description && (
              <span className="error-message">{formErrors.description}</span>
            )}
            <span className="char-count">{formData.description.length}/2000</span>
          </div>

          {/* Location Section */}
          <div className="location-section">
            <h3 className="section-title">📍 Location Information</h3>
            
            <div className="form-row">
              {/* Constituency */}
              <div className="form-group">
                <label htmlFor="constituency_id" className="form-label">
                  Constituency <span className="required">*</span>
                </label>
                <select
                  id="constituency_id"
                  name="constituency_id"
                  className={`form-select ${formErrors.constituency_id ? 'error' : ''}`}
                  value={formData.constituency_id}
                  onChange={handleChange}
                >
                  <option value="">Select constituency</option>
                  {constituencies.map(constituency => (
                    <option key={constituency.id} value={constituency.id}>
                      {constituency.name}
                    </option>
                  ))}
                </select>
                {formErrors.constituency_id && (
                  <span className="error-message">{formErrors.constituency_id}</span>
                )}
              </div>

              {/* Ward (Optional) */}
              <div className="form-group">
                <label htmlFor="ward_id" className="form-label">
                  Ward (Optional)
                </label>
                <select
                  id="ward_id"
                  name="ward_id"
                  className="form-select"
                  value={formData.ward_id}
                  onChange={handleChange}
                  disabled={!formData.constituency_id}
                >
                  <option value="">Select ward (optional)</option>
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                {!formData.constituency_id && (
                  <span className="help-text">Select a constituency first</span>
                )}
              </div>
            </div>
          </div>

          {/* Anonymous Submission */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_anonymous"
                checked={formData.is_anonymous}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">
                🎭 Submit anonymously
                <span className="help-text">Your name will not be displayed publicly</span>
              </span>
            </label>
          </div>

          {/* Guidelines Box */}
          <div className="guidelines-box">
            <h4>📋 Submission Guidelines</h4>
            <ul>
              <li>Be specific and accurate in your description</li>
              <li>Avoid using offensive or inappropriate language</li>
              <li>Include relevant details like location, time, and impact</li>
              <li>One issue per submission - don't combine multiple problems</li>
              <li>Duplicate issues may be merged with existing reports</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Submitting...
                </>
              ) : (
                <>
                  ✓ Submit Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitIssue