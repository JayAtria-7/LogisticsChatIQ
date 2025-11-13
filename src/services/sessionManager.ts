/**
 * LogisticsChatIQ - Session Manager
 * Author: Jay Atria
 * GitHub: https://github.com/JayAtria-7
 * License: MIT
 * Description: Manages user sessions and conversation state persistence
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {
  Session,
  Package,
  SessionMetadata,
  ConversationEntry,
  UserPreferences,
  SenderInfo,
  Address
} from '../models/types';
import { ConversationState } from '../models/enums';

/**
 * Session Manager - handles session state and persistence
 */
export class SessionManager {
  private session: Session;
  private sessionDir: string;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private currentState: ConversationState;

  constructor(sessionDir: string = './sessions') {
    this.sessionDir = sessionDir;
    this.currentState = ConversationState.WELCOME;
    this.session = this.initializeSession();
    this.ensureSessionDirectory();
  }

  /**
   * Initialize a new session
   */
  private initializeSession(): Session {
    const sessionId = uuidv4();
    const now = new Date();

    return {
      metadata: {
        sessionId,
        startTime: now,
        lastActivity: now,
        totalPackages: 0,
        completedPackages: 0,
        currency: 'USD'
      },
      packages: [],
      conversationHistory: [],
      currentPackage: undefined,
      templates: {},
      preferences: {
        commonAddresses: [],
        defaultCurrency: 'USD'
      }
    };
  }

  /**
   * Ensure session directory exists
   */
  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.session.metadata.sessionId;
  }

  /**
   * Get current session
   */
  getSession(): Session {
    return this.session;
  }

  /**
   * Get current state
   */
  getCurrentState(): ConversationState {
    return this.currentState;
  }

  /**
   * Set current state
   */
  setState(state: ConversationState): void {
    this.currentState = state;
    this.updateLastActivity();
  }

  /**
   * Add conversation entry
   */
  addConversationEntry(role: 'user' | 'bot', message: string, intent?: string, entities?: any): void {
    this.session.conversationHistory.push({
      timestamp: new Date(),
      role,
      message,
      intent,
      entities
    });
    this.updateLastActivity();
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationEntry[] {
    return this.session.conversationHistory;
  }

  /**
   * Initialize new package
   */
  startNewPackage(): void {
    this.session.currentPackage = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.updateLastActivity();
  }

  /**
   * Get current package
   */
  getCurrentPackage(): Partial<Package> | undefined {
    return this.session.currentPackage;
  }

  /**
   * Update current package field
   */
  updateCurrentPackage(field: string, value: any): void {
    if (!this.session.currentPackage) {
      this.startNewPackage();
    }
    
    (this.session.currentPackage as any)[field] = value;
    (this.session.currentPackage as any).updatedAt = new Date();
    this.updateLastActivity();
  }

  /**
   * Complete current package and add to packages list
   */
  completeCurrentPackage(): void {
    if (this.session.currentPackage) {
      this.session.packages.push(this.session.currentPackage as Package);
      this.session.metadata.totalPackages++;
      this.session.metadata.completedPackages++;
      this.session.currentPackage = undefined;
      this.updateLastActivity();
    }
  }

  /**
   * Get all packages
   */
  getPackages(): Package[] {
    return this.session.packages;
  }

  /**
   * Get package by ID
   */
  getPackageById(id: string): Package | undefined {
    return this.session.packages.find(pkg => pkg.id === id);
  }

  /**
   * Get last package
   */
  getLastPackage(): Package | undefined {
    if (this.session.packages.length === 0) return undefined;
    return this.session.packages[this.session.packages.length - 1];
  }

  /**
   * Update package
   */
  updatePackage(id: string, updates: Partial<Package>): boolean {
    const index = this.session.packages.findIndex(pkg => pkg.id === id);
    if (index === -1) return false;

    this.session.packages[index] = {
      ...this.session.packages[index],
      ...updates,
      updatedAt: new Date()
    };
    this.updateLastActivity();
    return true;
  }

  /**
   * Delete package
   */
  deletePackage(id: string): boolean {
    const index = this.session.packages.findIndex(pkg => pkg.id === id);
    if (index === -1) return false;

    this.session.packages.splice(index, 1);
    this.session.metadata.totalPackages--;
    this.session.metadata.completedPackages--;
    this.updateLastActivity();
    return true;
  }

  /**
   * Save template
   */
  saveTemplate(name: string, template: Partial<Package>): void {
    this.session.templates[name] = template;
    this.updateLastActivity();
  }

  /**
   * Get template
   */
  getTemplate(name: string): Partial<Package> | undefined {
    return this.session.templates[name];
  }

  /**
   * Get all template names
   */
  getTemplateNames(): string[] {
    return Object.keys(this.session.templates);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.session.preferences = {
      ...this.session.preferences,
      ...preferences
    };
    this.updateLastActivity();
  }

  /**
   * Add common address
   */
  addCommonAddress(address: Address): void {
    // Check if address already exists
    const exists = this.session.preferences.commonAddresses.some(
      addr => addr.street === address.street && addr.postalCode === address.postalCode
    );

    if (!exists) {
      this.session.preferences.commonAddresses.push(address);
      this.updateLastActivity();
    }
  }

  /**
   * Get common addresses
   */
  getCommonAddresses(): Address[] {
    return this.session.preferences.commonAddresses;
  }

  /**
   * Set default sender
   */
  setDefaultSender(sender: SenderInfo): void {
    this.session.preferences.defaultSender = sender;
    this.updateLastActivity();
  }

  /**
   * Get default sender
   */
  getDefaultSender(): SenderInfo | undefined {
    return this.session.preferences.defaultSender;
  }

  /**
   * Update total estimated cost
   */
  updateTotalCost(cost: number): void {
    this.session.metadata.totalEstimatedCost = cost;
    this.updateLastActivity();
  }

  /**
   * Update last activity time
   */
  private updateLastActivity(): void {
    this.session.metadata.lastActivity = new Date();
  }

  /**
   * Save session to file
   */
  async saveSession(): Promise<void> {
    const filename = path.join(this.sessionDir, `${this.session.metadata.sessionId}.session`);
    const data = JSON.stringify(this.session, null, 2);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filename, data, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Load session from file
   */
  async loadSession(sessionId: string): Promise<boolean> {
    const filename = path.join(this.sessionDir, `${sessionId}.session`);
    
    return new Promise((resolve) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          resolve(false);
        } else {
          try {
            this.session = JSON.parse(data);
            resolve(true);
          } catch {
            resolve(false);
          }
        }
      });
    });
  }

  /**
   * Enable auto-save
   */
  enableAutoSave(intervalMs: number = 30000): void {
    this.disableAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.saveSession().catch(err => {
        console.error('Auto-save failed:', err);
      });
    }, intervalMs);
  }

  /**
   * Disable auto-save
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * List all saved sessions
   */
  async listSessions(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(this.sessionDir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const sessions = files
            .filter(f => f.endsWith('.session'))
            .map(f => f.replace('.session', ''));
          resolve(sessions);
        }
      });
    });
  }

  /**
   * Delete session file
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const filename = path.join(this.sessionDir, `${sessionId}.session`);
    
    return new Promise((resolve) => {
      fs.unlink(filename, (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Clear current session (start fresh)
   */
  clearSession(): void {
    this.disableAutoSave();
    this.session = this.initializeSession();
    this.currentState = ConversationState.WELCOME;
  }
}
