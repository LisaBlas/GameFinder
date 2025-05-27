// Robust test script for keyword tracking
import fs from 'fs';
import path from 'path';
import { KeywordTrackingService } from './server/services/keywordTrackingService.js';

// File path to the keywords file
const keywordsFilePath = path.join(process.cwd(), 'client/src/assets/all_keywords.json');

// Function to read the current state of the file
function readKeywordsFile() {
  try {
    const content = fs.readFileSync(keywordsFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading keywords file:', error);
    return null;
  }
}

// Function to check a specific keyword's count
function checkKeywordCount(keywordId) {
  const keywords = readKeywordsFile();
  if (!keywords) return null;
  
  const keyword = keywords.find(k => k.id === keywordId);
  return keyword ? keyword.count || 0 : null;
}

// Test tracking a keyword and verify the file was updated
async function testKeywordTracking(keywordId) {
  console.log(`\n==== Testing keyword ID: ${keywordId} ====`);
  
  // Check the count before tracking
  const beforeCount = checkKeywordCount(keywordId);
  console.log(`Before tracking: count = ${beforeCount}`);
  
  // Create a new service instance
  const service = new KeywordTrackingService();
  
  // Track the keyword and force immediate save
  console.log('Tracking keyword...');
  const success = service.testTrackAndSave(keywordId);
  
  if (success) {
    console.log('Tracking reported as successful');
    
    // Wait a moment to ensure file operations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check the count after tracking
    const afterCount = checkKeywordCount(keywordId);
    console.log(`After tracking: count = ${afterCount}`);
    
    if (afterCount === beforeCount + 1) {
      console.log('✅ SUCCESS: File was correctly updated');
    } else {
      console.log('❌ FAILURE: File was not updated correctly');
      console.log(`Expected count: ${beforeCount + 1}, Actual count: ${afterCount}`);
    }
  } else {
    console.log('❌ FAILURE: Tracking was not successful');
  }
}

// Main test function
async function runTests() {
  console.log('Starting robust keyword tracking tests...');
  console.log(`Keywords file: ${keywordsFilePath}`);
  
  // Test a few keywords
  await testKeywordTracking(705);  // swordplay
  await testKeywordTracking(66);   // simulated reality
  
  console.log('\nTests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
