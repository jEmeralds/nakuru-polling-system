const express = require('express');
const router = express.Router();

// Get political positions
router.get('/political-positions', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('political_positions')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get political parties
router.get('/political-parties', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('political_parties')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;