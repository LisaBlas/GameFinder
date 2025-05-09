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
  
  // Search through all keywords
  const results = allKeywords
    .filter((keyword: Keyword) => {
      const matches = keyword.name.toLowerCase().includes(searchTerm);
      if (matches) {
        console.log('Found match:', keyword.name);
      }
      return matches;
    })
    .slice(0, 10); // Limit to 10 results for performance

  console.log('Found results:', results.length);
  res.json(results);
});

export default router; 