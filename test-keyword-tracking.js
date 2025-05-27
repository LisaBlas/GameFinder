// Simple test script for the KeywordTrackingService
// This script should be run with: npx tsx test-keyword-tracking.js
import { KeywordTrackingService } from './server/services/keywordTrackingService';

// Create an instance of the service
const keywordTrackingService = new KeywordTrackingService();

// Test tracking a few keywords (using some common IDs from your all_keywords.json)
console.log('Testing keyword tracking...');

// Choose a few keyword IDs to test with
const testKeywordIds = [
  38675, // "wario land ii"
  4613,  // "non-player character"
  38038, // "drawing"
  66,    // "simulated reality"
  705    // "swordplay"
];

// Track each keyword
testKeywordIds.forEach(id => {
  console.log(`\nTracking keyword ID: ${id}`);
  keywordTrackingService.testTrackAndSave(id);
});

// Force save any pending updates
console.log('\nForcing save of any pending updates...');
keywordTrackingService.forceSave();

console.log('\nTest completed! Check the all_keywords.json file to see if the counts were updated.');
