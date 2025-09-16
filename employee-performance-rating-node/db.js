/**
 * db.js
 * - Initializes SQLite database schema if --init is passed
 * - Exports a configured better-sqlite3 DB instance
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DB_PATH = path.join(DATA_DIR, 'epr.db');

const db = new Database(DB_PATH);

// Create tables if they don't exist
const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      employee_id TEXT,
      position TEXT,
      department TEXT,
      reviewer TEXT,
      review_period_start TEXT,
      review_period_end TEXT,
      overall_rating TEXT,
      strengths TEXT,
      improvements TEXT,
      goals TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS ratings_update_timestamp
    AFTER UPDATE ON ratings
    FOR EACH ROW
    BEGIN
      UPDATE ratings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
  console.log('Database initialized at', DB_PATH);
};

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--init')) {
    init();
    process.exit(0);
  } else {
    console.log('To initialize DB: node db.js --init');
    process.exit(0);
  }
}

init();

module.exports = db;
