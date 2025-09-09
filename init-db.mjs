// init-db.mjs
import { db } from './lib/db.js';
import bcrypt from 'bcryptjs';

async function initDB() {
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

  // Clear existing users to avoid duplicates on re-run
  db.exec('DELETE FROM users');
  console.log('Cleared existing users.');

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

  // Close the database connection
  db.close();
  console.log('Database connection closed.');
}

initDB().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
