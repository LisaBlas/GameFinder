// Direct file test script
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'client/src/assets/all_keywords.json');
console.log(`Reading from: ${filePath}`);

try {
  // Read the file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const keywords = JSON.parse(fileContent);
  console.log(`Successfully read ${keywords.length} keywords`);
  
  // Find a specific keyword to update
  const keywordId = 705; // swordplay
  const keyword = keywords.find(k => k.id === keywordId);
  
  if (keyword) {
    console.log(`Found keyword: ${keyword.name}, current count: ${keyword.count || 0}`);
    
    // Update the count
    keyword.count = 1000;
    console.log(`Updated count to 1000`);
    
    // Write back to the file
    fs.writeFileSync(filePath, JSON.stringify(keywords, null, 2));
    console.log(`File written successfully`);
    
    // Read again to verify
    const updatedContent = fs.readFileSync(filePath, 'utf-8');
    const updatedKeywords = JSON.parse(updatedContent);
    const updatedKeyword = updatedKeywords.find(k => k.id === keywordId);
    console.log(`After writing, keyword count is: ${updatedKeyword.count}`);
  } else {
    console.log(`Keyword with ID ${keywordId} not found`);
  }
} catch (error) {
  console.error('Error:', error);
}
