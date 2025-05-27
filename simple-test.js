// Simple test script for the KeywordTrackingService
import { KeywordTrackingService } from './server/services/keywordTrackingService.js';
import fs from 'fs';
import path from 'path';

// Create an instance of the service
const keywordTrackingService = new KeywordTrackingService();

// Test tracking a keyword
console.log('Testing keyword tracking...');

// Choose a keyword ID to test with
const testKeywordId = 705; // swordplay

// Get the current count
const keywordsPath = path.join(process.cwd(), 'dist/assets/all_keywords.json');
let currentCount = 0;

try {
  const data = fs.readFileSync(keywordsPath, 'utf-8');
  const keywords = JSON.parse(data);
  const keyword = keywords.find(k => k.id === testKeywordId);
  if (keyword) {
    currentCount = keyword.count || 0;
    console.log(`Current count for keyword ${keyword.name} (ID: ${testKeywordId}): ${currentCount}`);
  }
} catch (error) {
  console.error('Error reading keywords file:', error);
}

// Track the keyword and force immediate save
console.log(`\nTracking keyword ID: ${testKeywordId}`);
keywordTrackingService.testTrackAndSave(testKeywordId);

// Force save any pending updates
console.log('\nForcing save of any pending updates...');
keywordTrackingService.forceSave();

// Verify the count was updated
try {
  const data = fs.readFileSync(keywordsPath, 'utf-8');
  const keywords = JSON.parse(data);
  const keyword = keywords.find(k => k.id === testKeywordId);
  if (keyword) {
    console.log(`\nAfter tracking, count for keyword ${keyword.name} (ID: ${testKeywordId}): ${keyword.count}`);
    if (keyword.count === currentCount + 1) {
      console.log('✅ SUCCESS: Count was correctly incremented');
    } else {
      console.log(`❌ FAILURE: Count was not correctly incremented. Expected: ${currentCount + 1}, Actual: ${keyword.count}`);
    }
  }
} catch (error) {
  console.error('Error reading keywords file after update:', error);
}

console.log('\nTest completed!');
