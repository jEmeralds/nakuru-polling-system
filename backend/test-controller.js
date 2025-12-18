// =====================================================
// TEST FILE: backend/test-controller.js
// Run this to test if pollsController loads properly
// =====================================================

const pollsController = require('./src/controllers/pollsController');

console.log('\n🔍 TESTING POLLSCONTROLLER EXPORTS:\n');
console.log('createPoll:', typeof pollsController.createPoll);
console.log('getPolls:', typeof pollsController.getPolls);
console.log('getPollById:', typeof pollsController.getPollById);
console.log('castVote:', typeof pollsController.castVote);
console.log('updatePollStatus:', typeof pollsController.updatePollStatus);
console.log('deletePoll:', typeof pollsController.deletePoll);

console.log('\n✅ All exports:', Object.keys(pollsController));

if (typeof pollsController.createPoll === 'undefined') {
  console.log('\n❌ ERROR: createPoll is undefined!');
  console.log('This means pollsController.js is not exporting correctly.');
} else {
  console.log('\n✅ SUCCESS: All functions are exported correctly!');
}