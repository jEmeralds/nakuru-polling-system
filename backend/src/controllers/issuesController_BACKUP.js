// backend/src/controllers/pollsController.js
const { supabase } = require('../config/database');

// Get all polls
exports.getAllPolls = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, polls: data || [] });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

// Get single poll
exports.getPollById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { data: poll, error } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check if user voted
    const { data: vote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('poll_id', id)
      .single();

    // Get results
    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', id)
      .order('vote_count', { ascending: false });

    res.json({
      success: true,
      poll: {
        ...poll,
        has_voted: !!vote,
        results: { total_votes: poll.total_votes, options }
      }
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};

// Cast vote
exports.castVote = async (req, res) => {
  const { pollId, optionId } = req.body;
  const userId = req.user.id;

  try {
    // Check if already voted
    const { data: existing } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('poll_id', pollId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Insert vote
    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, option_id: optionId, user_id: userId });

    if (error) throw error;

    // Get updated results
    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('vote_count', { ascending: false });

    const { data: poll } = await supabase
      .from('polls')
      .select('total_votes')
      .eq('id', pollId)
      .single();

    res.json({
      success: true,
      message: 'Vote cast successfully',
      results: { total_votes: poll.total_votes, options }
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
};

// Get poll results
exports.getPollResults = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', id)
      .order('vote_count', { ascending: false });

    const { data: poll } = await supabase
      .from('polls')
      .select('total_votes')
      .eq('id', id)
      .single();

    res.json({
      success: true,
      results: { total_votes: poll?.total_votes || 0, options: options || [] }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};