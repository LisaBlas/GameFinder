import type { User, InsertUser } from "@shared/schema";

export type Token = {
  id: number;
  access_token: string;
  expires_in: number;
  expires_at: Date;
  token_type: string;
};

export type InsertToken = Omit<Token, "id">;

export type Search = {
  id: number;
  filters: unknown;
  results_count: number;
  page: number;
  exclude_count: number;
  created_at: Date;
};

export type InsertSearch = Omit<Search, "id" | "created_at">;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token management
  getLatestToken(): Promise<Token | undefined>;
  saveToken(token: InsertToken): Promise<Token>;
  
  // Search history
  saveSearch(search: InsertSearch): Promise<Search>;
  getRecentSearches(limit?: number): Promise<Search[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokenStorage: Token[];
  private searches: Search[];
  userCurrentId: number;
  tokenCurrentId: number;
  searchCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tokenStorage = [];
    this.searches = [];
    this.userCurrentId = 1;
    this.tokenCurrentId = 1;
    this.searchCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getLatestToken(): Promise<Token | undefined> {
    // Return the most recent token (if any)
    if (this.tokenStorage.length === 0) return undefined;
    
    return this.tokenStorage[this.tokenStorage.length - 1];
  }
  
  async saveToken(token: InsertToken): Promise<Token> {
    const id = this.tokenCurrentId++;
    const newToken: Token = { ...token, id };
    this.tokenStorage.push(newToken);
    
    // Keep only the latest token
    if (this.tokenStorage.length > 1) {
      this.tokenStorage = [this.tokenStorage[this.tokenStorage.length - 1]];
    }
    
    return newToken;
  }
  
  async saveSearch(search: InsertSearch): Promise<Search> {
    const id = this.searchCurrentId++;
    const newSearch: Search = { 
      ...search, 
      id, 
      created_at: new Date() 
    };
    
    this.searches.push(newSearch);
    
    // Limit the number of stored searches
    if (this.searches.length > 100) {
      this.searches = this.searches.slice(-100);
    }
    
    return newSearch;
  }
  
  async getRecentSearches(limit: number = 10): Promise<Search[]> {
    return this.searches
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
