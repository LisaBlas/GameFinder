// Create a new keywords file
import fs from 'fs';
import path from 'path';

const originalFilePath = path.join(process.cwd(), 'client/src/assets/all_keywords.json');
const newFilePath = path.join(process.cwd(), 'client/src/assets/all_keywords_new.json');

console.log(`Reading from: ${originalFilePath}`);
try {
  // Read the original file
  const fileContent = fs.readFileSync(originalFilePath, 'utf-8');
  const keywords = JSON.parse(fileContent);
  console.log(`Successfully read ${keywords.length} keywords`);
  
  // Update counts for specific keywords
  const keywordsToUpdate = [
    { id: 705, name: 'swordplay', count: 1000 },
    { id: 66, name: 'simulated reality', count: 500 },
    { id: 38675, name: 'wario land ii', count: 250 }
  ];
  
  keywordsToUpdate.forEach(updateInfo => {
    const keyword = keywords.find(k => k.id === updateInfo.id);
    if (keyword) {
      console.log(`Updating ${keyword.name} from ${keyword.count || 0} to ${updateInfo.count}`);
      keyword.count = updateInfo.count;
    }
  });
  
  // Write to the new file
  fs.writeFileSync(newFilePath, JSON.stringify(keywords, null, 2));
  console.log(`Created new file at: ${newFilePath}`);
  
  // Verify the new file
  const newContent = fs.readFileSync(newFilePath, 'utf-8');
  const newKeywords = JSON.parse(newContent);
  
  keywordsToUpdate.forEach(updateInfo => {
    const keyword = newKeywords.find(k => k.id === updateInfo.id);
    console.log(`In new file: ${keyword.name}, count = ${keyword.count}`);
  });
  
  console.log('\nNow you can use the new file (all_keywords_new.json) instead of the original one.');
} catch (error) {
  console.error('Error:', error);
}
