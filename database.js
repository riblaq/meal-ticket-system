const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// 1. Open (or create) the database file
const db = new Database('meal-ticket.db');

// 2. Create the users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    staff_id TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'attendant', 'staff'))
  )
`);

// 3. Create the tickets table
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'redeemed')),
    redeemed_by INTEGER,
    redeemed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (redeemed_by) REFERENCES users(id),
    UNIQUE (user_id, meal_date)
  )
`);

// 4. Create the first admin account if none exists
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();

if (!adminExists) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (full_name, staff_id, password, role) VALUES (?, ?, ?, ?)'
  ).run('System Admin', 'ADMIN001', hashed, 'admin');
  console.log('First admin created. Staff ID: ADMIN001, Password: admin123');
}

module.exports = db;