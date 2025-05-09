import type { NextApiRequest, NextApiResponse } from 'next';

interface Keyword {
  id: number;
  name: string;
}

// Import the keywords data from the correct location
const allKeywords: Keyword[] = require('../../../assets/all_keywords.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    return res.status(200).json(results);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 