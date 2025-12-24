/**
 * Connection pooling for SQLite
 * Manages multiple database connections for better concurrency
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'bookings.db');
const MAX_CONNECTIONS = 5;
const CONNECTION_TIMEOUT = 30000; // 30 seconds

interface ConnectionPoolConfig {
  maxConnections?: number;
  timeout?: number;
}

class ConnectionPool {
  private connections: Database.Database[] = [];
  private available: Database.Database[] = [];
  private inUse: Set<Database.Database> = new Set();
  private maxConnections: number;
  private timeout: number;
  private initializing: boolean = false;

  constructor(config: ConnectionPoolConfig = {}) {
    this.maxConnections = config.maxConnections || MAX_CONNECTIONS;
    this.timeout = config.timeout || CONNECTION_TIMEOUT;
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.initializing || this.connections.length > 0) {
      return;
    }

    this.initializing = true;

    for (let i = 0; i < this.maxConnections; i++) {
      const conn = this.createConnection();
      this.connections.push(conn);
      this.available.push(conn);
    }

    this.initializing = false;
  }

  /**
   * Create a new database connection
   */
  private createConnection(): Database.Database {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000'); // 5 second busy timeout
    return db;
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<Database.Database> {
    await this.initialize();

    // Try to get an available connection
    if (this.available.length > 0) {
      const conn = this.available.pop()!;
      this.inUse.add(conn);
      return conn;
    }

    // If we haven't reached max connections, create a new one
    if (this.connections.length < this.maxConnections) {
      const conn = this.createConnection();
      this.connections.push(conn);
      this.inUse.add(conn);
      return conn;
    }

    // Wait for a connection to become available
    const startTime = Date.now();
    while (this.available.length === 0) {
      if (Date.now() - startTime > this.timeout) {
        throw new Error('Connection pool timeout: no connections available');
      }
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const conn = this.available.pop()!;
    this.inUse.add(conn);
    return conn;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(conn: Database.Database): void {
    if (this.inUse.has(conn)) {
      this.inUse.delete(conn);
      this.available.push(conn);
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  async execute<T>(query: string, params?: any[]): Promise<T> {
    const conn = await this.getConnection();
    try {
      const stmt = conn.prepare(query);
      const result = params ? stmt.all(...params) : stmt.all();
      return result as T;
    } finally {
      this.releaseConnection(conn);
    }
  }

  /**
   * Execute a transaction with automatic connection management
   */
  async transaction<T>(callback: (conn: Database.Database) => T): Promise<T> {
    const conn = await this.getConnection();
    try {
      conn.exec('BEGIN TRANSACTION');
      const result = callback(conn);
      conn.exec('COMMIT');
      return result;
    } catch (error) {
      conn.exec('ROLLBACK');
      throw error;
    } finally {
      this.releaseConnection(conn);
    }
  }

  /**
   * Close all connections in the pool
   */
  close(): void {
    for (const conn of this.connections) {
      try {
        conn.close();
      } catch (error) {
        // Ignore errors when closing
      }
    }
    this.connections = [];
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.connections.length,
      available: this.available.length,
      inUse: this.inUse.size,
      max: this.maxConnections
    };
  }

  /**
   * Health check - verify all connections are working
   */
  async healthCheck(): Promise<boolean> {
    for (const conn of this.connections) {
      try {
        conn.prepare('SELECT 1').get();
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}

// Singleton instance
let pool: ConnectionPool | null = null;

/**
 * Get the connection pool instance
 */
export function getConnectionPool(config?: ConnectionPoolConfig): ConnectionPool {
  if (!pool) {
    pool = new ConnectionPool(config);
  }
  return pool;
}

/**
 * Close the connection pool
 */
export function closeConnectionPool(): void {
  if (pool) {
    pool.close();
    pool = null;
  }
}

/**
 * Execute query with connection pooling
 */
export async function pooledQuery<T>(query: string, params?: any[]): Promise<T> {
  const pool = getConnectionPool();
  return await pool.execute<T>(query, params);
}

/**
 * Execute transaction with connection pooling
 */
export async function pooledTransaction<T>(callback: (conn: Database.Database) => T): Promise<T> {
  const pool = getConnectionPool();
  return await pool.transaction(callback);
}