// backend/src/services/pollCronService.js
// Automated task to close expired polls

const cron = require('node-cron');
const supabase = require('../config/database');

/**
 * Close polls that have passed their end_date
 */
const closeExpiredPolls = async () => {
  try {
    const now = new Date().toISOString();
    
    console.log('🕐 Running auto-close expired polls task...');

    // Find all active polls where end_date has passed
    const { data: expiredPolls, error: fetchError } = await supabase
      .from('polls')
      .select('id, title, end_date')
      .eq('status', 'active')
      .lt('end_date', now);

    if (fetchError) {
      console.error('❌ Error fetching expired polls:', fetchError);
      return;
    }

    if (!expiredPolls || expiredPolls.length === 0) {
      console.log('✅ No expired polls to close');
      return;
    }

    // Update their status to 'closed'
    const pollIds = expiredPolls.map(p => p.id);
    
    const { error: updateError } = await supabase
      .from('polls')
      .update({ 
        status: 'closed',
        updated_at: now
      })
      .in('id', pollIds);

    if (updateError) {
      console.error('❌ Error closing polls:', updateError);
      return;
    }

    console.log(`✅ Auto-closed ${expiredPolls.length} expired poll(s):`);
    expiredPolls.forEach(poll => {
      console.log(`   - "${poll.title}" (ended: ${new Date(poll.end_date).toLocaleString()})`);
    });

  } catch (error) {
    console.error('❌ Error in closeExpiredPolls:', error);
  }
};

/**
 * Initialize cron jobs
 */
const initializeCronJobs = () => {
  console.log('⏰ Initializing poll cron jobs...');

  // Run every 15 minutes: */15 * * * *
  // Format: minute hour day month weekday
  cron.schedule('*/15 * * * *', () => {
    closeExpiredPolls();
  });

  // Also run immediately on startup
  closeExpiredPolls();

  console.log('✅ Poll cron jobs initialized (runs every 15 minutes)');
};

module.exports = {
  initializeCronJobs,
  closeExpiredPolls
};