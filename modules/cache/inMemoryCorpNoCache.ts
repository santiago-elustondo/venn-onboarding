/**
 * In-memory cache for corporation number validation results
 * 
 * Provides TTL-based caching with automatic expiration to reduce
 * redundant API calls for the same corporation numbers.
 */

import type { PlausibleCorpNo } from "../domain/corpNo";
import type { CorpNoValidationResult } from "../io/corpFetcher";

export interface CorpNoCache {
  get(corporationNumber: PlausibleCorpNo): CorpNoValidationResult | undefined;
  set(corporationNumber: PlausibleCorpNo, result: CorpNoValidationResult, ttlMs?: number): void;
  delete(corporationNumber: PlausibleCorpNo): boolean;
  clear(): void;
  size(): number;
}

interface CacheEntry {
  result: CorpNoValidationResult;
  expiresAt: number;
}

/**
 * Simple in-memory cache implementation with TTL support
 */
export class InMemoryCorpNoCache implements CorpNoCache {
  private cache = new Map<PlausibleCorpNo, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly defaultTtlMs: number;
  
  constructor(defaultTtlMs: number = 5 * 60 * 1000, cleanupIntervalMs: number = 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
    
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }
  
  get(corporationNumber: PlausibleCorpNo): CorpNoValidationResult | undefined {
    const entry = this.cache.get(corporationNumber);
    
    if (!entry) {
      return undefined;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(corporationNumber);
      return undefined;
    }
    
    return entry.result;
  }
  
  set(
    corporationNumber: PlausibleCorpNo, 
    result: CorpNoValidationResult, 
    ttlMs?: number
  ): void {
    const actualTtlMs = ttlMs ?? this.defaultTtlMs;
    const expiresAt = Date.now() + actualTtlMs;
    
    this.cache.set(corporationNumber, {
      result,
      expiresAt,
    });
  }
  
  delete(corporationNumber: PlausibleCorpNo): boolean {
    return this.cache.delete(corporationNumber);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    // Clean up expired entries before returning size
    this.cleanup();
    return this.cache.size;
  }
  
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
  
  private cleanup(): void {
    const now = Date.now();
    const toDelete: PlausibleCorpNo[] = [];
    
    // Use Array.from to handle iterator compatibility
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }
}

/**
 * Create a default cache instance
 */
export function createDefaultCorpNoCache(
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): CorpNoCache {
  return new InMemoryCorpNoCache(ttlMs);
}