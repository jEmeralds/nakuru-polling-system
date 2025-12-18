// =====================================================
// FIXED pollsController.js with proper vote counting
// =====================================================

const supabase = require('../config/database');

/**
 * CREATE POLL
 */
const createPoll = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      poll_type,
      position_id,
      county_id,
      constituency_id,
      ward_id,
      allow_anonymous,
      require_verification,
      max_responses_per_user,
      candidates
    } = req.body;
    
    const userId = req.user.id;

    console.log('📝 Creating poll:', { 
      title, 
      poll_type, 
      position_id,
      candidates: candidates?.length 
    });

    // Validation
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Title, start date, and end date are required' 
      });
    }

    if (!position_id) {
      return res.status(400).json({ 
        error: 'Position is required (select Governor, Senator, MP, etc.)' 
      });
    }

    if (!candidates || candidates.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 candidates are required' 
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate <= startDate) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    // STEP 1: Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description: description || null,
        position_id: position_id,
        county_id: county_id || null,
        constituency_id: constituency_id || null,
        ward_id: ward_id || null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        poll_type: poll_type || 'single_choice',
        allow_anonymous: allow_anonymous !== undefined ? allow_anonymous : false,
        require_verification: require_verification !== undefined ? require_verification : true,
        max_responses_per_user: max_responses_per_user || 1,
        status: 'draft',
        created_by: userId,
        total_votes: 0
      })
      .select()
      .single();

    if (pollError) {
      console.error('❌ Poll creation error:', pollError);
      throw pollError;
    }

    console.log('✅ Poll created:', poll.id);

    // STEP 2: Create candidates in candidates table
    const candidatesData = candidates.map(candidate => ({
      name: candidate.name,
      position_id: position_id,
      party_id: candidate.party_id || null,
      county_id: county_id || null,
      constituency_id: constituency_id || null,
      ward_id: ward_id || null,
      age: candidate.age || null,
      gender: candidate.gender || null,
      bio: candidate.bio || null,
      campaign_slogan: candidate.slogan || null,
      phone_number: candidate.phone_number || null,
      email: candidate.email || null,
      registration_status: 'approved',
      verification_status: 'verified'
    }));

    const { data: createdCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidatesData)
      .select();

    if (candidatesError) {
      console.error('❌ Candidates creation error:', candidatesError);
      await supabase.from('polls').delete().eq('id', poll.id);
      throw candidatesError;
    }

    console.log(`✅ ${createdCandidates.length} candidates created`);

    // STEP 3: Link candidates to poll
    const pollCandidatesData = createdCandidates.map((candidate, index) => ({
      poll_id: poll.id,
      candidate_id: candidate.id,
      display_order: index,
      is_active: true
    }));

    const { data: linkedCandidates, error: linkError } = await supabase
      .from('poll_candidates')
      .insert(pollCandidatesData)
      .select();

    if (linkError) {
      console.error('❌ Poll-candidates linking error:', linkError);
      await supabase.from('candidates').delete().in('id', createdCandidates.map(c => c.id));
      await supabase.from('polls').delete().eq('id', poll.id);
      throw linkError;
    }

    console.log(`✅ ${linkedCandidates.length} candidates linked to poll`);

    res.status(201).json({
      message: 'Poll created successfully',
      poll: {
        ...poll,
        candidates: createdCandidates
      }
    });

  } catch (error) {
    console.error('❌ Error in createPoll:', error);
    res.status(500).json({ 
      error: 'Failed to create poll',
      details: error.message 
    });
  }
};

/**
 * GET ALL POLLS
 */
const getAllPolls = async (req, res) => {
  try {
    const { status, poll_type, position_id } = req.query;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    console.log('📊 Fetching polls...', { status, poll_type, position_id, isAdmin });

    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_candidates!inner (
          id,
          display_order,
          is_active,
          candidates (*)
        )
      `)
      .order('created_at', { ascending: false });

    // Non-admins can see active and closed polls, but not drafts
    if (!isAdmin) {
      query = query.in('status', ['active', 'closed']);
    } else if (status) {
      // Admins can filter by specific status
      query = query.eq('status', status);
    }

    if (poll_type) {
      query = query.eq('poll_type', poll_type);
    }

    if (position_id) {
      query = query.eq('position_id', position_id);
    }

    const { data: polls, error } = await query;

    if (error) {
      console.error('❌ Error fetching polls:', error);
      throw error;
    }

    const formattedPolls = polls?.map(poll => ({
      ...poll,
      candidates: poll.poll_candidates?.map(pc => ({
        ...pc.candidates,
        display_order: pc.display_order,
        is_active: pc.is_active
      })) || []
    })) || [];

    console.log(`✅ Retrieved ${formattedPolls.length} polls`);
    res.json(formattedPolls);

  } catch (error) {
    console.error('❌ Error in getAllPolls:', error);
    res.status(500).json({ 
      error: 'Failed to fetch polls',
      details: error.message 
    });
  }
};

/**
 * GET POLL BY ID - WITH VOTE COUNTS
 */
const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log('📝 Fetching poll:', id);

    // Get poll with candidates
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_candidates (
          id,
          display_order,
          is_active,
          candidates (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Poll not found' });
      }
      throw error;
    }

    // Get vote counts for each candidate
    const { data: voteCounts, error: voteError } = await supabase
      .from('poll_responses')
      .select('candidate_id')
      .eq('poll_id', id);

    if (voteError) {
      console.error('❌ Error fetching vote counts:', voteError);
    }

    // Count votes per candidate
    const voteCountMap = {};
    let totalVotes = 0;
    
    if (voteCounts) {
      voteCounts.forEach(vote => {
        voteCountMap[vote.candidate_id] = (voteCountMap[vote.candidate_id] || 0) + 1;
        totalVotes++;
      });
    }

    // Check if current user has voted
    let hasVoted = false;
    if (userId) {
      const { data: userVote } = await supabase
        .from('poll_responses')
        .select('id')
        .eq('poll_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      
      hasVoted = !!userVote;
    }

    // Format candidates with vote counts
    poll.candidates = poll.poll_candidates?.map(pc => ({
      ...pc.candidates,
      display_order: pc.display_order,
      is_active: pc.is_active,
      vote_count: voteCountMap[pc.candidates.id] || 0
    })) || [];

    delete poll.poll_candidates;
    poll.total_votes = totalVotes;
    poll.has_voted = hasVoted;

    console.log(`✅ Retrieved poll ${id} with ${totalVotes} votes`);
    res.json(poll);

  } catch (error) {
    console.error('❌ Error in getPollById:', error);
    res.status(500).json({ 
      error: 'Failed to fetch poll',
      details: error.message 
    });
  }
};

/**
 * CAST VOTE - FIXED
 */
const castVote = async (req, res) => {
  try {
    const { pollId, candidateId } = req.body;
    const userId = req.user?.id;

    console.log('🗳️ Casting vote:', { pollId, candidateId, userId });
    console.log('🔐 User object:', req.user);

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required. Please log in to vote.' 
      });
    }

    if (!pollId || !candidateId) {
      return res.status(400).json({ 
        error: 'Poll ID and Candidate ID are required' 
      });
    }

    // Check poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, status, start_date, end_date')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ error: 'Poll is not active' });
    }

    const now = new Date();
    const startDate = new Date(poll.start_date);
    const endDate = new Date(poll.end_date);

    if (now < startDate) {
      return res.status(400).json({ error: 'Voting has not started yet' });
    }

    if (now > endDate) {
      return res.status(400).json({ error: 'Voting has ended' });
    }

    // Check candidate exists in poll
    const { data: pollCandidate, error: pcError } = await supabase
      .from('poll_candidates')
      .select('id, is_active')
      .eq('poll_id', pollId)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (pcError) {
      console.error('❌ Error checking poll_candidates:', pcError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pollCandidate) {
      return res.status(404).json({ error: 'Candidate not found in this poll' });
    }

    if (!pollCandidate.is_active) {
      return res.status(400).json({ error: 'This candidate is not active' });
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    // Record vote - Database will auto-populate timestamp
    const { data: vote, error: voteError } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        candidate_id: candidateId,
        user_id: userId,
        response_method: 'web' // Required field
      })
      .select()
      .single();

    if (voteError) {
      console.error('❌ Error recording vote:', voteError);
      return res.status(500).json({ 
        error: 'Failed to record vote',
        details: voteError.message 
      });
    }

    console.log(`✅ Vote recorded successfully`);
    
    res.status(201).json({
      message: 'Vote recorded successfully',
      vote
    });

  } catch (error) {
    console.error('❌ Error in castVote:', error);
    res.status(500).json({ 
      error: 'Failed to record vote',
      details: error.message 
    });
  }
};

/**
 * UPDATE POLL STATUS
 */
const updatePollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating poll status:', { id, status });

    const validStatuses = ['draft', 'active', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const { data: poll, error } = await supabase
      .from('polls')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating poll status:', error);
      throw error;
    }

    console.log(`✅ Poll ${id} status changed to ${status}`);
    
    res.json({
      message: 'Poll status updated successfully',
      poll
    });

  } catch (error) {
    console.error('❌ Error in updatePollStatus:', error);
    res.status(500).json({ 
      error: 'Failed to update poll status',
      details: error.message 
    });
  }
};

/**
 * DELETE POLL
 */
const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting poll:', id);

    const { data: pollCandidates } = await supabase
      .from('poll_candidates')
      .select('candidate_id')
      .eq('poll_id', id);

    const candidateIds = pollCandidates?.map(pc => pc.candidate_id) || [];

    await supabase.from('poll_responses').delete().eq('poll_id', id);
    await supabase.from('poll_candidates').delete().eq('poll_id', id);

    if (candidateIds.length > 0) {
      await supabase.from('candidates').delete().in('id', candidateIds);
    }

    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

    if (pollError) {
      console.error('❌ Error deleting poll:', pollError);
      throw pollError;
    }

    console.log(`✅ Poll ${id} deleted successfully`);
    
    res.json({
      message: 'Poll deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in deletePoll:', error);
    res.status(500).json({ 
      error: 'Failed to delete poll',
      details: error.message 
    });
  }
};

module.exports = {
  createPoll,
  getAllPolls,
  getPollById,
  castVote,
  updatePollStatus,
  deletePoll
};