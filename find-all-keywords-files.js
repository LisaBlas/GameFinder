// Script to find all instances of all_keywords.json and check their content
import fs from 'fs';
import path from 'path';

// Function to recursively search for files
function findFiles(dir, fileName, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git') {
        findFiles(filePath, fileName, results);
      }
    } else if (file === fileName) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to check a specific keyword in a file
function checkKeywordInFile(filePath, keywordId) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const keywords = JSON.parse(data);
    const keyword = keywords.find(k => k.id === keywordId);
    
    return {
      path: filePath,
      size: fs.statSync(filePath).size,
      lastModified: fs.statSync(filePath).mtime,
      keywordCount: keyword ? keyword.count : 'not found'
    };
  } catch (error) {
    return {
      path: filePath,
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 'N/A',
      lastModified: fs.existsSync(filePath) ? fs.statSync(filePath).mtime : 'N/A',
      error: error.message
    };
  }
}

// Main function
async function findAllKeywordsFiles() {
  const rootDir = process.cwd();
  console.log(`Searching for all_keywords.json files in ${rootDir}...`);
  
  const files = findFiles(rootDir, 'all_keywords.json');
  console.log(`Found ${files.length} files:`);
  
  // Check each file for specific keywords
  const keywordId = 705; // swordplay
  
  files.forEach(file => {
    const result = checkKeywordInFile(file, keywordId);
    console.log(`\nFile: ${result.path}`);
    console.log(`Size: ${result.size} bytes`);
    console.log(`Last Modified: ${result.lastModified}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Keyword ID ${keywordId} count: ${result.keywordCount}`);
      
      // Try to update this file
      try {
        const data = fs.readFileSync(result.path, 'utf8');
        const keywords = JSON.parse(data);
        const keyword = keywords.find(k => k.id === keywordId);
        
        if (keyword) {
          keyword.count = 999; // Set to a distinctive value
          fs.writeFileSync(result.path, JSON.stringify(keywords, null, 2));
          console.log(`Updated keyword count to 999 in this file`);
        }
      } catch (updateError) {
        console.log(`Failed to update this file: ${updateError.message}`);
      }
    }
  });
}

// Run the search
findAllKeywordsFiles().catch(error => {
  console.error('Error:', error);
});
