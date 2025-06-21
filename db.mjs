import Database from 'better-sqlite3';

const db = new Database('./storage.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    chat_id INTEGER NOT NULL PRIMARY KEY,
    player_name TEXT
  );
`);

export function registerUser(chatId, playerName) {
  const stmt = db.prepare('INSERT OR REPLACE INTO users (chat_id, player_name) VALUES (?, ?)');
  stmt.run(chatId, playerName);
}

export function getAllUsers() {
  return db.prepare('SELECT player_name, chat_id FROM users').all();
}
