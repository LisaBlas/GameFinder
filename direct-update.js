// Direct update script - no dependencies on existing code
import fs from 'fs';
import path from 'path';

// Get the absolute path to the keywords file
const filePath = path.resolve(process.cwd(), 'client/src/assets/all_keywords.json');
console.log(`Target file: ${filePath}`);

// Function to read the file
function readFile() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

// Function to write the file
function writeFile(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
}

// Main function
async function updateKeywords() {
  console.log('Reading keywords file...');
  const keywords = readFile();
  
  if (!keywords) {
    console.log('Failed to read keywords file');
    return;
  }
  
  console.log(`Read ${keywords.length} keywords`);
  
  // Keywords to update
  const keywordsToUpdate = [
    { id: 705, name: 'swordplay' },
    { id: 66, name: 'simulated reality' },
    { id: 38675, name: 'wario land ii' }
  ];
  
  // Update each keyword
  keywordsToUpdate.forEach(keywordInfo => {
    const keyword = keywords.find(k => k.id === keywordInfo.id);
    if (keyword) {
      const oldCount = keyword.count || 0;
      keyword.count = 100; // Set to a fixed value for testing
      console.log(`Updated ${keyword.name} from ${oldCount} to ${keyword.count}`);
    } else {
      console.log(`Keyword ${keywordInfo.name} (ID: ${keywordInfo.id}) not found`);
    }
  });
  
  // Write the updated keywords back to the file
  console.log('Writing updated keywords to file...');
  const success = writeFile(keywords);
  
  if (success) {
    console.log('Successfully wrote keywords to file');
    
    // Verify the changes
    console.log('Verifying changes...');
    const updatedKeywords = readFile();
    
    if (updatedKeywords) {
      keywordsToUpdate.forEach(keywordInfo => {
        const keyword = updatedKeywords.find(k => k.id === keywordInfo.id);
        if (keyword) {
          console.log(`Verified ${keyword.name} has count ${keyword.count}`);
        }
      });
    }
  } else {
    console.log('Failed to write keywords to file');
  }
}

// Run the update
updateKeywords().catch(error => {
  console.error('Error:', error);
});
