// =====================================================
// FILE: backend/src/controllers/candidatesController.js
// COMPLETE REWRITE - Matches actual database schema
// =====================================================

const supabase = require('../config/database');  // ✅ FIXED - No destructuring

// =====================================================
// GET ALL CANDIDATES
// =====================================================

/**
 * Get all candidates with optional filters
 * Query params: position_id, party_id, county_id
 */
exports.getAllCandidates = async (req, res) => {
  try {
    const { position_id, party_id, county_id, constituency_id, ward_id } = req.query;

    let query = supabase
      .from('candidates')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (position_id) {
      query = query.eq('position_id', position_id);
    }

    if (party_id) {
      query = query.eq('party_id', party_id);
    }

    if (county_id) {
      query = query.eq('county_id', county_id);
    }

    if (constituency_id) {
      query = query.eq('constituency_id', constituency_id);
    }

    if (ward_id) {
      query = query.eq('ward_id', ward_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data?.length || 0,
      candidates: data || []
    });

  } catch (error) {
    console.error('❌ Get candidates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
      details: error.message
    });
  }
};

// =====================================================
// GET SINGLE CANDIDATE
// =====================================================

exports.getCandidateById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      candidate
    });

  } catch (error) {
    console.error('❌ Get candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate'
    });
  }
};

// =====================================================
// CREATE CANDIDATE (ADMIN)
// =====================================================

exports.createCandidate = async (req, res) => {
  try {
    const {
      name,
      position_id,
      party_id,
      county_id,
      constituency_id,
      ward_id,
      age,
      gender,
      profession,
      education_level,
      phone_number,
      email,
      bio,
      campaign_slogan,
      campaign_color,
      manifesto_url,
      website_url,
      profile_image_url,
      social_media,
      verification_status,
      registration_status
    } = req.body;

    // Validate required fields
    if (!name || !position_id) {
      return res.status(400).json({
        success: false,
        error: 'Name and position_id are required'
      });
    }

    // Insert candidate
    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert({
        name,
        position_id,
        party_id,
        county_id,
        constituency_id,
        ward_id,
        age,
        gender,
        profession,
        education_level,
        phone_number,
        email,
        bio,
        campaign_slogan,
        campaign_color,
        manifesto_url,
        website_url,
        profile_image_url,
        social_media,
        verification_status: verification_status || 'unverified',
        registration_status: registration_status || 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      candidate
    });

  } catch (error) {
    console.error('❌ Create candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create candidate',
      details: error.message
    });
  }
};

// =====================================================
// UPDATE CANDIDATE (ADMIN)
// =====================================================

exports.updateCandidate = async (req, res) => {
  const { id } = req.params;

  try {
    const updateData = { ...req.body };
    updateData.updated_at = new Date().toISOString();

    // Remove id if it's in the body
    delete updateData.id;
    delete updateData.created_at;

    const { data: candidate, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      candidate
    });

  } catch (error) {
    console.error('❌ Update candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate'
    });
  }
};

// =====================================================
// DELETE CANDIDATE (ADMIN)
// =====================================================

exports.deleteCandidate = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if candidate has received votes
    const { data: votes, error: votesError } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('candidate_id', id)
      .limit(1);

    if (votesError) throw votesError;

    if (votes && votes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete candidate who has received votes'
      });
    }

    // Delete candidate
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete candidate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete candidate'
    });
  }
};

// =====================================================
// GET CANDIDATES BY POSITION (For Polls)
// =====================================================

exports.getCandidatesByPosition = async (req, res) => {
  const { position_id } = req.params;

  try {
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('position_id', position_id)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      count: candidates?.length || 0,
      candidates: candidates || []
    });

  } catch (error) {
    console.error('❌ Get candidates by position error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates for position'
    });
  }
};

// =====================================================
// GET CANDIDATE STATISTICS
// =====================================================

exports.getCandidateStats = async (req, res) => {
  const { id } = req.params;

  try {
    // Get candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Get total votes
    const { data: votes, error: votesError } = await supabase
      .from('poll_responses')
      .select('id, poll_id')
      .eq('candidate_id', id);

    if (votesError) throw votesError;

    const totalVotes = votes?.length || 0;

    // Get votes by poll
    const votesByPoll = {};
    votes?.forEach(vote => {
      votesByPoll[vote.poll_id] = (votesByPoll[vote.poll_id] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          party_id: candidate.party_id,
          position_id: candidate.position_id
        },
        total_votes: totalVotes,
        votes_by_poll: votesByPoll
      }
    });

  } catch (error) {
    console.error('❌ Get candidate stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate statistics'
    });
  }
};

module.exports = exports;