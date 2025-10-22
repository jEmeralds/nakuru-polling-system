// backend/src/controllers/adminController.js
const { supabase } = require('../config/database');

/**
 * Get admin dashboard statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin statistics...');

    // Get issue counts by status
    const { data: issuesByStatus } = await supabase
      .from('issues')
      .select('status');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get issues created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Calculate status counts
    const statusCounts = {
      submitted: 0,
      'under review': 0,
      'in progress': 0,
      resolved: 0,
      rejected: 0
    };

    issuesByStatus?.forEach(issue => {
      if (statusCounts.hasOwnProperty(issue.status)) {
        statusCounts[issue.status]++;
      }
    });

    const stats = {
      overview: {
        totalIssues: issuesByStatus?.length || 0,
        totalUsers: totalUsers || 0,
        recentIssues: recentIssues || 0,
        activeIssues: statusCounts.submitted + statusCounts['under review'] + statusCounts['in progress']
      },
      issuesByStatus: statusCounts
    };

    console.log('✅ Admin stats fetched successfully');
    res.json({ success: true, stats });

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Get detailed issue statistics
 */
exports.getIssueStats = async (req, res) => {
  try {
    console.log('📊 Fetching detailed issue statistics...');

    // Get all issues with category info
    const { data: issues } = await supabase
      .from('issues')
      .select('*, issue_categories(name)');

    // Calculate statistics
    const categoryStats = {};
    let totalUpvotes = 0;
    let totalViews = 0;
    let totalComments = 0;

    issues?.forEach(issue => {
      // Category stats
      const categoryName = issue.issue_categories?.name || 'Unknown';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = 0;
      }
      categoryStats[categoryName]++;

      // Totals
      totalUpvotes += issue.upvotes_count || 0;
      totalViews += issue.views_count || 0;
      totalComments += issue.comments_count || 0;
    });

    const stats = {
      totalIssues: issues?.length || 0,
      totalUpvotes,
      totalViews,
      totalComments,
      averageUpvotes: issues?.length ? (totalUpvotes / issues.length).toFixed(1) : 0,
      averageViews: issues?.length ? (totalViews / issues.length).toFixed(1) : 0,
      byCategory: categoryStats
    };

    console.log('✅ Issue stats fetched successfully');
    res.json({ success: true, stats });

  } catch (error) {
    console.error('❌ Error fetching issue stats:', error);
    res.status(500).json({ error: 'Failed to fetch issue statistics' });
  }
};

/**
 * Get all issues with full details (admin view)
 */
exports.getAllIssues = async (req, res) => {
  try {
    console.log('📋 Admin fetching all issues...');
    
    const { status, category_id, priority, sort } = req.query;

    let query = supabase
      .from('issues')
      .select(`
        *,
        issue_categories (
          id,
          name,
          icon
        ),
        users!issues_user_id_fkey (
          id,
          full_name,
          phone_number
        )
      `);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', parseInt(category_id));
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_upvoted':
        query = query.order('upvotes_count', { ascending: false });
        break;
      case 'most_viewed':
        query = query.order('views_count', { ascending: false });
        break;
      default: // 'newest'
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('✅ Admin issues fetched:', data?.length || 0);
    res.json({ success: true, issues: data || [] });

  } catch (error) {
    console.error('❌ Error fetching admin issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

/**
 * Get single issue by ID (admin view with full details)
 */
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Admin fetching issue:', id);

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_categories (
          id,
          name,
          icon
        ),
        users!issues_user_id_fkey (
          id,
          full_name,
          phone_number,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    console.log('✅ Admin issue fetched');
    res.json({ success: true, issue: data });

  } catch (error) {
    console.error('❌ Error fetching admin issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
};

/**
 * Update issue status (admin only)
 */
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    console.log('🔄 Admin updating issue status:', id, 'to', status);

    // Validate status
    const validStatuses = ['submitted', 'under review', 'in progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Prepare update data
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // If status is resolved, set resolved_at timestamp
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Issue status updated to:', status);
    res.json({ success: true, issue: data });

  } catch (error) {
    console.error('❌ Error updating issue status:', error);
    res.status(500).json({ error: 'Failed to update issue status' });
  }
};

/**
 * Add admin response to issue
 */
exports.addAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.user.id;

    console.log('💬 Admin adding response to issue:', id);

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const { data, error } = await supabase
      .from('issues')
      .update({
        admin_response: response.trim(),
        admin_response_by: adminId,
        admin_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Admin response added');
    res.json({ success: true, issue: data });

  } catch (error) {
    console.error('❌ Error adding admin response:', error);
    res.status(500).json({ error: 'Failed to add admin response' });
  }
};

/**
 * Update issue priority
 */
exports.updateIssuePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    console.log('⚡ Admin updating issue priority:', id, 'to', priority);

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: 'Invalid priority',
        validPriorities 
      });
    }

    const { data, error } = await supabase
      .from('issues')
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Issue priority updated to:', priority);
    res.json({ success: true, issue: data });

  } catch (error) {
    console.error('❌ Error updating issue priority:', error);
    res.status(500).json({ error: 'Failed to update issue priority' });
  }
};