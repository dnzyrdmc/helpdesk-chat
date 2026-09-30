-- Referans şema: uygulama açılışında IF NOT EXISTS ile oluşturulur.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),subject TEXT,status TEXT DEFAULT 'open',created_at TEXT);
 CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,ticket TEXT REFERENCES tickets(id),author TEXT REFERENCES users(id),body TEXT,created_at TEXT);
