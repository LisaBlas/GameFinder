// File check script
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'client/src/assets/all_keywords.json');
console.log(`Target file: ${filePath}`);

// Check if file exists
if (fs.existsSync(filePath)) {
  console.log(`File exists at: ${filePath}`);
  
  // Get file stats
  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);
  console.log(`Last modified: ${stats.mtime}`);
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf-8');
  const keywords = JSON.parse(content);
  
  // Check a specific keyword
  const keywordId = 705; // swordplay
  const keyword = keywords.find(k => k.id === keywordId);
  console.log(`Keyword ${keywordId} (${keyword?.name}): count = ${keyword?.count || 0}`);
  
  // Create a test file in the same directory
  const testFilePath = path.join(path.dirname(filePath), 'test-file.json');
  fs.writeFileSync(testFilePath, JSON.stringify({ test: true, timestamp: new Date().toISOString() }));
  console.log(`Created test file at: ${testFilePath}`);
  
  // List all files in the directory
  const dirPath = path.dirname(filePath);
  console.log(`\nListing all files in: ${dirPath}`);
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const fileStats = fs.statSync(fullPath);
    console.log(`- ${file} (${fileStats.size} bytes, last modified: ${fileStats.mtime})`);
  });
} else {
  console.log(`File does not exist at: ${filePath}`);
}
