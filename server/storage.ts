// Simple in-memory storage for tokens and search history
// In a production environment, this would be backed by a database

interface Token {
  access_token: string;
  expires_in: number;
  expires_at: Date;
  token_type: string;
}

interface SearchHistory {
  id?: number;
  timestamp: Date;
  filters: any;
  results_count: number;
}

class Storage {
  private tokens: Token[] = [];
  private searches: SearchHistory[] = [];
  private searchIdCounter = 1;

  // Token management
  async saveToken(token: Token): Promise<void> {
    this.tokens.push(token);
    
    // Keep only the most recent tokens (max 10)
    if (this.tokens.length > 10) {
      this.tokens = this.tokens.slice(-10);
    }
  }

  async getLatestToken(): Promise<Token | null> {
    if (this.tokens.length === 0) {
      return null;
    }
    
    // Return the most recent token
    return this.tokens[this.tokens.length - 1];
  }

  // Search history management
  async saveSearch(searchData: Omit<SearchHistory, 'id' | 'timestamp'>): Promise<SearchHistory> {
    const newSearch: SearchHistory = {
      id: this.searchIdCounter++,
      timestamp: new Date(),
      ...searchData
    };
    
    this.searches.push(newSearch);
    
    // Keep only the most recent 100 searches
    if (this.searches.length > 100) {
      this.searches = this.searches.slice(-100);
    }
    
    return newSearch;
  }

  async getSearchHistory(limit: number = 20): Promise<SearchHistory[]> {
    // Return the most recent searches
    return this.searches
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new Storage();
