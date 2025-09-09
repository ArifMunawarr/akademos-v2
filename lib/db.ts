import Database from 'better-sqlite3';
import path from 'path';

// Define a global symbol to store the database instance
declare global {
  var dbInstance: Database.Database | undefined;
}

// Determine the path to the database file.
// In development, it will be in the project root.
// In production, it might be in a different location depending on the deployment setup.
const dbPath = path.resolve(process.cwd(), 'akademos.db');

function initializeDb(): Database.Database {
  console.log(`Initializing new database connection at ${dbPath}`);
  const db = new Database(dbPath, { verbose: console.log });

  // Ensure the connection is closed when the app shuts down
  process.on('exit', () => {
    if (db && db.open) {
      console.log('Closing database connection.');
      db.close();
    }
  });

  return db;
}

// Use a singleton pattern to avoid creating multiple connections, especially in development with hot-reloading.
if (process.env.NODE_ENV === 'production') {
  if (!global.dbInstance) {
    global.dbInstance = initializeDb();
  }
} else {
  if (!global.dbInstance) {
    global.dbInstance = initializeDb();
  }
}

export const db = global.dbInstance as Database.Database;
