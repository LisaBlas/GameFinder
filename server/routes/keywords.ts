import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KeywordTrackingService } from '../services/keywordTrackingService';

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

// Initialize the keyword tracking service
const keywordTrackingService = new KeywordTrackingService();

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
  
  // If a keyword is searched and found, we could optionally track this too
  if (results.length > 0) {
    // Track the first result as it's the most relevant
    keywordTrackingService.trackKeywordUsage(results[0].id);
  }
  
  res.json(results);
});

// New endpoints for keyword usage statistics

// Get most used keywords
router.get('/most-used', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const mostUsed = keywordTrackingService.getMostUsedKeywords(limit);
  res.json(mostUsed);
});

// Get usage for a specific keyword by ID
router.get('/usage/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const usage = keywordTrackingService.getKeywordUsage(id);
  res.json({ id, usage });
});

// Track usage of a keyword by ID
router.post('/track/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const success = keywordTrackingService.trackKeywordUsage(id);
  
  if (success) {
    res.json({ success: true, message: 'Keyword usage tracked' });
  } else {
    res.status(404).json({ success: false, message: 'Keyword not found' });
  }
});

// Track usage of a keyword by name
router.post('/track-by-name', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Keyword name is required' });
  }
  
  const success = keywordTrackingService.trackKeywordUsageByName(name);
  
  if (success) {
    res.json({ success: true, message: 'Keyword usage tracked' });
  } else {
    res.status(404).json({ success: false, message: 'Keyword not found' });
  }
});

// Test endpoint to immediately track and save a keyword usage
router.get('/test-track/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`[keywords] Testing immediate tracking for keyword ID: ${id}`);
  
  // Use the test function that immediately saves
  const success = keywordTrackingService.testTrackAndSave(id);
  
  if (success) {
    res.json({ 
      success: true, 
      message: 'Keyword usage tracked and saved immediately',
      keywordId: id
    });
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Keyword not found',
      keywordId: id
    });
  }
});

export default router;