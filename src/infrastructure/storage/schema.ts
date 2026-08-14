/**
 * IndexedDB Schema Definitions for AIDock
 * Defines the structure for storing prompts, notes, and history
 */

// Prompt schema
export interface Prompt {
  id: string;
  content: string;
  title: string;
  category?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  /** Which workspace owns this prompt. Omitted = the default workspace. */
  workspaceId?: string;
  // Optional metadata
  wordCount?: number;
  characterCount?: number;
  // Enhancement metadata
  enhancementHistory?: {
    original: string;
    enhanced: string;
    enhancementType: string;
    timestamp: number;
  }[];
}

// Note schema (linked to prompts or standalone)
export interface AINote {
  id: string;
  content: string;
  title: string;
  /** Which workspace owns this note. Omitted = the default workspace. */
  workspaceId?: string;
  // Linked entities
  promptId?: string;
  responseId?: string;
  aiResponseContent?: string;
  // Content properties
  format: 'markdown' | 'plain' | 'code';
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

// Prompt History schema (automatic tracking)
export interface PromptHistoryEntry {
  id: string;
  promptContent: string;
  aiResponseContent: string;
  aiPlatform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot' | 'grok' | 'poe' | 'openrouter';
  url: string;
  timestamp: number;
  /** Which workspace owns this history entry. Omitted = the default workspace. */
  workspaceId?: string;
  // Optional categorization
  category?: string;
  tags: string[];
  isFavorite: boolean;
  /** Set automatically by the storage service; used for sync merge resolution. */
  updatedAt: number;
  // Metadata
  responseLength?: number;
  durationMs?: number;
}

// Collections/Folders schema
export interface PromptCollection {
  id: string;
  name: string;
  description?: string;
  color?: string; // For visual identification
  promptIds: string[]; // References to prompts
  /** Which workspace owns this collection. Omitted = the default workspace. */
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

// Workspaces — top-level containers that scope Prompts, Notes, Collections, and History.
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

// Database version
export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'AIDockDB';

// Object store names
export const OBJECT_STORES = {
  PROMPTS: 'prompts',
  NOTES: 'notes',
  HISTORY: 'history',
  COLLECTIONS: 'collections'
} as const;