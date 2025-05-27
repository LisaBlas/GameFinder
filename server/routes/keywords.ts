import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

interface Keyword {
  id: number;
  name: string;
}

const router = express.Router();

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load keywords data
const keywordsPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, './assets/all_keywords.json')
  : path.join(__dirname, '../../client/src/assets/all_keywords.json');
const allKeywords: Keyword[] = JSON.parse(fs.readFileSync(keywordsPath, 'utf-8'));

router.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const searchTerm = q.toLowerCase();
  console.log('Searching for:', searchTerm);
  console.log('Total keywords:', allKeywords.length);
  
  // Search through all keywords and sort by match priority
  const results = allKeywords
    .filter((keyword: Keyword) => {
      const keywordName = keyword.name.toLowerCase();
      return keywordName.includes(searchTerm);
    })
    .sort((a: Keyword, b: Keyword) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact match gets highest priority
      if (aName === searchTerm && bName !== searchTerm) return -1;
      if (bName === searchTerm && aName !== searchTerm) return 1;

      // Starts with search term gets second priority
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

      // Contains search term gets third priority
      if (aName.includes(searchTerm) && !bName.includes(searchTerm)) return -1;
      if (bName.includes(searchTerm) && !aName.includes(searchTerm)) return 1;

      // If both have same priority, sort alphabetically
      return aName.localeCompare(bName);
    })
    .slice(0, 10); // Limit to 10 results for performance

  console.log('Found results:', results.length);
  res.json(results);
});

export default router; 