// scripts/init-db.ts
import { db } from '../lib/db';
import bcrypt from 'bcryptjs';

async function initDB() {
  console.log('Starting database initialization...');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student'))
    );
  `);

  console.log('"users" table created or already exists.');

  // Create participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      ipaddres TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('online', 'offline'))
    );
  `);

  // Enforce uniqueness on IP addresses to avoid duplicates
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS participants_ip_unique ON participants(ipaddres)`);

  console.log('"participants" table created or already exists.');

  // Add updated_time column if it doesn't exist
  try {
    const pragma = db.prepare("PRAGMA table_info(participants)").all() as Array<{ name: string }>;
    const hasUpdated = pragma.some((c) => c.name === 'updated_time');
    if (!hasUpdated) {
      // SQLite restriction: cannot use non-constant function in DEFAULT during ALTER TABLE
      db.exec("ALTER TABLE participants ADD COLUMN updated_time TEXT");
      console.log('Added updated_time column to participants');
    }
  } catch (e) {
    console.warn('Could not ensure updated_time column on participants:', e);
  }

  // Initialize updated_time for any existing rows that might be NULL
  db.exec("UPDATE participants SET updated_time = COALESCE(updated_time, datetime('now', 'localtime'))");

  console.log('"participants" table created or already exists.');

  // NEW: Create rooms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_name TEXT NOT NULL UNIQUE,
      join_key TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('"rooms" table created or already exists.');

  // Clear existing users to avoid duplicates on re-run
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
        db.exec('DELETE FROM users');
        console.log('Cleared existing users.');
    }
  } catch (error) {
    // Table might not exist yet, which is fine.
  }

  // Hash passwords
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // Insert sample users
  const insert = db.prepare(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
  );

  insert.run('teacher', teacherPassword, 'teacher');
  insert.run('student', studentPassword, 'student');

  console.log('Seeded "teacher" and "student" users.');

  // Clear participants and reset AUTOINCREMENT so it starts at 1
  try {
    db.exec('DELETE FROM participants');
    // Reset sqlite autoincrement sequence for participants (if table exists)
    try {
      db.exec("DELETE FROM sqlite_sequence WHERE name = 'participants'");
    } catch {}
    console.log('Cleared participants and reset ID sequence.');
  } catch (e) {
    console.warn('Could not clear participants:', e);
  }

  // Close the database connection
  db.close();
  console.log('Database connection closed.');
  console.log('Database initialization complete.');
}

initDB().catch((err) => {
  console.error('Failed to initialize database:', err);
  db.close(); // Ensure db is closed on error
  process.exit(1);
});
