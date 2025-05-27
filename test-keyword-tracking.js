// Simple test script for the KeywordTrackingService
// This script should be run with: npx tsx test-keyword-tracking.js
import { KeywordTrackingService } from './server/services/keywordTrackingService.js';
import fs from 'fs';
import path from 'path';

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

// Read the file directly to verify changes
const filePath = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'server/assets/all_keywords.json')
  : path.join(process.cwd(), 'client/src/assets/all_keywords.json');

console.log(`\nReading file directly from: ${filePath}`);
try {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const keywords = JSON.parse(fileContent);
  
  // Check the counts of our test keywords
  testKeywordIds.forEach(id => {
    const keyword = keywords.find(k => k.id === id);
    console.log(`Keyword ID ${id} (${keyword?.name}): count = ${keyword?.count || 0}`);
  });
  
  // Write directly to the file to test if that works
  console.log('\nTrying direct file write...');
  // Find a keyword to update
  const testKeyword = keywords.find(k => k.id === 705); // swordplay
  if (testKeyword) {
    testKeyword.count = 999; // Set a distinctive value
    fs.writeFileSync(filePath, JSON.stringify(keywords, null, 2));
    console.log(`Directly updated keyword ${testKeyword.name} count to 999`);
  }

} catch (error) {
  console.error('Error reading/writing file directly:', error);
}

console.log('\nTest completed! Check the all_keywords.json file to see if the counts were updated.');
