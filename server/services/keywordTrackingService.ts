import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface Keyword {
  id: number;
  name: string;
  count?: number;
}

export class KeywordTrackingService {
  private keywordsPath: string;
  private keywords: Keyword[] = [];
  private pendingUpdates: Set<number> = new Set();
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 5000; // 5 seconds
  private isWriting = false;
  private writeQueue: (() => void)[] = [];
  
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Ensure we're using the correct path to the keywords file
    this.keywordsPath = process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '../assets/all_keywords.json')
      : path.join(__dirname, '../../client/src/assets/all_keywords.json');
    
    console.log(`[KeywordTrackingService] Using keywords file at: ${this.keywordsPath}`);
    
    // Check if the file exists
    if (!fs.existsSync(this.keywordsPath)) {
      console.error(`[KeywordTrackingService] ERROR: Keywords file not found at ${this.keywordsPath}`);
    } else {
      console.log(`[KeywordTrackingService] Keywords file found at ${this.keywordsPath}`);
    }
    
    this.loadKeywords();
  }
  
  private loadKeywords() {
    try {
      const data = fs.readFileSync(this.keywordsPath, 'utf-8');
      this.keywords = JSON.parse(data);
      
      // Initialize count property if it doesn't exist
      this.keywords = this.keywords.map(keyword => ({
        ...keyword,
        count: keyword.count || 0
      }));
      
      console.log(`[KeywordTrackingService] Loaded ${this.keywords.length} keywords`);
    } catch (error) {
      console.error('[KeywordTrackingService] Error loading keywords:', error);
      this.keywords = [];
    }
  }
  
  public trackKeywordUsage(keywordId: number) {
    const keywordIndex = this.keywords.findIndex(k => k.id === keywordId);
    
    if (keywordIndex !== -1) {
      // Increment the count
      this.keywords[keywordIndex].count = (this.keywords[keywordIndex].count || 0) + 1;
      
      // Schedule a save
      this.pendingUpdates.add(keywordId);
      this.scheduleSave();
      
      console.log(`[KeywordTrackingService] Tracked usage of keyword: ${this.keywords[keywordIndex].name} (ID: ${keywordId}), new count: ${this.keywords[keywordIndex].count}`);
      return true;
    }
    
    console.log(`[KeywordTrackingService] Keyword ID ${keywordId} not found`);
    return false;
  }
  
  public trackKeywordUsageByName(keywordName: string) {
    const keywordIndex = this.keywords.findIndex(
      k => k.name.toLowerCase() === keywordName.toLowerCase()
    );
    
    if (keywordIndex !== -1) {
      // Increment the count
      this.keywords[keywordIndex].count = (this.keywords[keywordIndex].count || 0) + 1;
      
      // Schedule a save
      this.pendingUpdates.add(this.keywords[keywordIndex].id);
      this.scheduleSave();
      
      console.log(`[KeywordTrackingService] Tracked usage of keyword by name: ${keywordName}, new count: ${this.keywords[keywordIndex].count}`);
      return true;
    }
    
    console.log(`[KeywordTrackingService] Keyword name "${keywordName}" not found`);
    return false;
  }
  
  public getKeywordUsage(keywordId: number) {
    const keyword = this.keywords.find(k => k.id === keywordId);
    return keyword ? keyword.count || 0 : 0;
  }
  
  public getMostUsedKeywords(limit = 10) {
    return [...this.keywords]
      .filter(k => (k.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit);
  }
  
  private scheduleSave() {
    if (this.saveTimeout === null) {
      this.saveTimeout = setTimeout(() => {
        this.saveKeywords();
        this.pendingUpdates.clear();
        this.saveTimeout = null;
      }, this.SAVE_DELAY);
    }
  }
  
  private saveKeywords() {
    if (this.isWriting) {
      // Queue this write operation
      this.writeQueue.push(() => this.saveKeywords());
      console.log(`[KeywordTrackingService] Write operation queued (${this.writeQueue.length} in queue)`);
      return;
    }
    
    this.isWriting = true;
    
    try {
      // Check if the file exists and is writable
      try {
        fs.accessSync(this.keywordsPath, fs.constants.W_OK);
      } catch (accessError) {
        console.error(`[KeywordTrackingService] File is not writable: ${this.keywordsPath}`, accessError);
        console.log('[KeywordTrackingService] Attempting to write anyway...');
      }
      
      console.log(`[KeywordTrackingService] Saving keywords with ${this.pendingUpdates.size} pending updates`);
      
      // Create a backup of the file before writing
      if (fs.existsSync(this.keywordsPath)) {
        const backupPath = `${this.keywordsPath}.backup`;
        try {
          fs.copyFileSync(this.keywordsPath, backupPath);
          console.log(`[KeywordTrackingService] Created backup at ${backupPath}`);
        } catch (backupError) {
          console.warn(`[KeywordTrackingService] Failed to create backup:`, backupError);
        }
      }
      
      // Write the updated keywords to the file
      fs.writeFileSync(this.keywordsPath, JSON.stringify(this.keywords, null, 2));
      
      // Verify the file was written correctly
      try {
        const writtenData = fs.readFileSync(this.keywordsPath, 'utf-8');
        const parsedData = JSON.parse(writtenData);
        console.log(`[KeywordTrackingService] Keywords saved successfully (${parsedData.length} keywords)`);
      } catch (verifyError) {
        console.error('[KeywordTrackingService] Failed to verify written data:', verifyError);
      }
    } catch (error) {
      console.error('[KeywordTrackingService] Error saving keywords:', error);
    } finally {
      this.isWriting = false;
      
      // Process next write operation in queue if any
      if (this.writeQueue.length > 0) {
        console.log(`[KeywordTrackingService] Processing next write operation from queue (${this.writeQueue.length} remaining)`);
        const nextWrite = this.writeQueue.shift();
        nextWrite?.();
      }
    }
  }
  
  // Force save immediately (useful for server shutdown)
  public forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.pendingUpdates.size > 0) {
      this.saveKeywords();
      this.pendingUpdates.clear();
    }
  }
  
  // Test function to immediately track and save a keyword usage
  public testTrackAndSave(keywordId: number) {
    const success = this.trackKeywordUsage(keywordId);
    if (success) {
      // Skip the timeout and save immediately
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.saveKeywords();
      console.log(`[KeywordTrackingService] TEST: Immediately saved keyword ${keywordId} usage`);
    }
    return success;
  }
}
