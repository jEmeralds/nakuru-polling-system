// backend/src/controllers/issuesController.js
const { supabase } = require('../config/database');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    console.log('📁 Fetching categories...');
    
    const { data, error } = await supabase
      .from('issue_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    console.log('✅ Categories fetched:', data?.length || 0);
    res.json({ success: true, categories: data || [] });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get all issues with filters
exports.getIssues = async (req, res) => {
  try {
    console.log('📝 Fetching issues...');
    console.log('Query params:', req.query);
    
    const { category_id, status, search } = req.query;
    
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by category_id (this is the actual column name in database)
    if (category_id && category_id !== 'all') {
      console.log('Filtering by category_id:', category_id);
      query = query.eq('category_id', category_id);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      console.log('Filtering by status:', status);
      query = query.eq('status', status);
    }
    
    // Search in title and description
    if (search && search.trim()) {
      console.log('Searching for:', search);
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log('✅ Issues fetched:', data?.length || 0);
    res.json({ success: true, issues: data || [] });
  } catch (error) {
    console.error('❌ Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

// Get single issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Fetching issue:', id);
    
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    console.log('✅ Issue fetched:', data.title);
    res.json({ success: true, issue: data });
  } catch (error) {
    console.error('❌ Error fetching issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
};

// Get comments for an issue
// Get comments for an issue
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('💬 Fetching comments for issue:', id);
    
    const { data, error } = await supabase
      .from('issue_comments')
      .select(`
        *,
        users!issue_comments_user_id_fkey (
          id,
          full_name,
          phone_number
        )
      `)
      .eq('issue_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log('✅ Comments fetched:', data?.length || 0);
    res.json({ success: true, comments: data || [] });
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create new issue
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category_id, constituency, ward, is_anonymous } = req.body;
    
    console.log('📝 Creating issue:', { title, category_id, constituency });
    
    // Validate required fields
    if (!title || !description || !category_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'description', 'category_id']
      });
    }
    
    // Build location description from constituency and ward
    const location = ward ? `${ward}, ${constituency}` : constituency || 'Nakuru';
    
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category_id: parseInt(category_id), // Ensure it's a number
        location_description: location,
        is_anonymous: is_anonymous || false,
        status: 'submitted',
        upvotes_count: 0,
        views_count: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log('✅ Issue created:', data.id);
    res.status(201).json({ success: true, issue: data, id: data.id });
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    res.status(500).json({ 
      error: 'Failed to create issue',
      details: error.message 
    });
  }
};

// Update issue status (admin only)
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('📝 Updating issue status:', id, 'to', status);
    
    const validStatuses = ['submitted', 'under review', 'in progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const { data, error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Issue status updated');
    res.json({ success: true, issue: data });
  } catch (error) {
    console.error('❌ Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
};

// Toggle upvote on issue
exports.toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('👍 Toggling upvote for issue:', id);
    
    // Check if already upvoted
    const { data: existing } = await supabase
      .from('issue_upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // Remove upvote
      await supabase
        .from('issue_upvotes')
        .delete()
        .eq('id', existing.id);
      
      console.log('✅ Upvote removed');
      res.json({ success: true, upvoted: false });
    } else {
      // Add upvote
      await supabase
        .from('issue_upvotes')
        .insert({ issue_id: id, user_id: userId });
      
      console.log('✅ Upvote added');
      res.json({ success: true, upvoted: true });
    }
  } catch (error) {
    console.error('❌ Error toggling upvote:', error);
    res.status(500).json({ error: 'Failed to toggle upvote' });
  }
};

// Add comment to issue
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;
    const userId = req.user.id;
    
    console.log('💬 Adding comment to issue:', id);
    
    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const { data, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: id,
        user_id: userId,
        comment_text: comment_text.trim()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Comment added');
    res.status(201).json({ success: true, comment: data });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
// Increment view count for issue
exports.incrementView = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('👁️ Incrementing view for issue:', id);
    
    // First get the current count
    const { data: issue } = await supabase
      .from('issues')
      .select('views_count')
      .eq('id', id)
      .single();
    
    // Then update it
    const { error } = await supabase
      .from('issues')
      .update({ 
        views_count: (issue?.views_count || 0) + 1
      })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ View count incremented');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error incrementing view:', error);
    res.status(500).json({ error: 'Failed to increment view' });
  }
};