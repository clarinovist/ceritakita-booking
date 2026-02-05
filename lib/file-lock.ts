/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * File locking utilities for concurrent uploads
 * Prevents race conditions when multiple requests try to access the same resources
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const LOCK_DIR = path.join(process.cwd(), 'data', 'locks');
const LOCK_TIMEOUT = 30000; // 30 seconds

// Ensure lock directory exists
async function ensureLockDir() {
  try {
    await fs.mkdir(LOCK_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

/**
 * Generate lock file path
 */
function getLockPath(resource: string): string {
  const hash = crypto.createHash('md5').update(resource).digest('hex');
  return path.join(LOCK_DIR, `${hash}.lock`);
}

/**
 * Check if a lock exists
 */
async function isLocked(resource: string): Promise<boolean> {
  const lockPath = getLockPath(resource);
  try {
    await fs.access(lockPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for lock to be released
 */
async function waitForLock(resource: string, timeout: number = LOCK_TIMEOUT): Promise<boolean> {
  const startTime = Date.now();
  let delay = 50; // Initial delay
  
  while (Date.now() - startTime < timeout) {
    const locked = await isLocked(resource);
    if (!locked) {
      return true;
    }

    // Exponential backoff with jitter
    const jitter = Math.floor(Math.random() * 20);
    await new Promise(resolve => setTimeout(resolve, delay + jitter));

    // Increase delay for next iteration, capped at 200ms
    delay = Math.min(delay * 1.2, 200);
  }
  
  return false;
}

/**
 * Acquire a lock for a resource
 * Returns true if lock acquired, false if timeout
 */
export async function acquireLock(
  resource: string,
  timeout: number = LOCK_TIMEOUT
): Promise<boolean> {
  await ensureLockDir();
  
  // Check if already locked
  const alreadyLocked = await isLocked(resource);
  if (alreadyLocked) {
    // Wait for existing lock to be released
    const acquired = await waitForLock(resource, timeout);
    if (!acquired) {
      return false;
    }
  }
  
  // Create lock file
  const lockPath = getLockPath(resource);
  const lockData = {
    timestamp: Date.now(),
    pid: process.pid,
    resource
  };
  
  try {
    await fs.writeFile(lockPath, JSON.stringify(lockData), { flag: 'wx' });
    return true;
  } catch {
    // File might have been created between check and write
    return false;
  }
}

/**
 * Release a lock
 */
export async function releaseLock(resource: string): Promise<void> {
  const lockPath = getLockPath(resource);
  try {
    await fs.unlink(lockPath);
  } catch {
    // Lock might not exist or already be released
  }
}

/**
 * Execute function with lock protection
 * Automatically acquires and releases lock
 */
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  timeout: number = LOCK_TIMEOUT
): Promise<T> {
  const acquired = await acquireLock(resource, timeout);
  
  if (!acquired) {
    throw new Error(`Failed to acquire lock for resource: ${resource}`);
  }
  
  try {
    return await fn();
  } finally {
    await releaseLock(resource);
  }
}

/**
 * Check lock status (for debugging)
 */
export async function getLockStatus(resource: string): Promise<{
  locked: boolean;
  data?: any;
  age?: number;
} | null> {
  const lockPath = getLockPath(resource);
  
  try {
    const content = await fs.readFile(lockPath, 'utf-8');
    const data = JSON.parse(content);
    const age = Date.now() - data.timestamp;
    
    return {
      locked: true,
      data,
      age
    };
  } catch {
    return {
      locked: false
    };
  }
}

/**
 * Force remove a lock (emergency use only)
 */
export async function forceRemoveLock(resource: string): Promise<boolean> {
  const lockPath = getLockPath(resource);
  
  try {
    await fs.unlink(lockPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cleanup stale locks (older than timeout)
 */
export async function cleanupStaleLocks(): Promise<number> {
  await ensureLockDir();
  
  const files = await fs.readdir(LOCK_DIR);
  let cleaned = 0;
  
  for (const file of files) {
    if (!file.endsWith('.lock')) continue;
    
    const lockPath = path.join(LOCK_DIR, file);
    try {
      const content = await fs.readFile(lockPath, 'utf-8');
      const data = JSON.parse(content);
      
      if (Date.now() - data.timestamp > LOCK_TIMEOUT) {
        await fs.unlink(lockPath);
        cleaned++;
      }
    } catch {
      // File might have been deleted
    }
  }
  
  return cleaned;
}

// Auto-cleanup stale locks every 5 minutes
setInterval(() => {
  cleanupStaleLocks().catch(() => {});
}, 5 * 60 * 1000);