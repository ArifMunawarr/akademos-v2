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

  console.log('"participants" table created or already exists.');

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

  // Seed participants
  const insertParticipant = db.prepare(
    'INSERT INTO participants (nama, ipaddres, status) VALUES (?, ?, ?)'
  );

  insertParticipant.run('Participant 1', '192.168.1.1', 'online');
  insertParticipant.run('Participant 2', '192.168.1.2', 'offline');

  console.log('Seeded initial participants.');

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
