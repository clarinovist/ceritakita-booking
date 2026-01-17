const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'bookings.db');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('Database file does not exist at:', dbPath);
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const db = new Database(dbPath);

// Check if users table exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users';").get();

if (!tableExists) {
    console.log('Users table does not exist. Creating it...');
     db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      permissions TEXT
    )
  `);
}

const username = 'admin';
const password = 'admin123';
const saltRounds = 12;
const passwordHash = bcrypt.hashSync(password, saltRounds);

// Check if user exists
const userExists = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

if (userExists) {
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?');
    const info = stmt.run(passwordHash, username);
    console.log(`Password for user '${username}' reset to '${password}'`);
} else {
    console.log(`User '${username}' not found. Creating...`);
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    const insert = db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)');
    insert.run(id, username, passwordHash, 'admin');
    console.log(`User '${username}' created with password '${password}'`);
}
