DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS shoots;
DROP TABLE IF EXISTS persons;

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS persons (
id INTEGER PRIMARY KEY AUTOINCREMENT,
firstName TEXT NOT NULL,
lastName TEXT NOT NULL,
ethnicity TEXT NOT NULL,
gender TEXT NOT NULL,
age INTEGER NOT NULL,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shoots (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
costumeGender TEXT NOT NULL,
costume TEXT NOT NULL,
backdrop TEXT,
personId INTEGER,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS images (
id INTEGER PRIMARY KEY AUTOINCREMENT,
shootId INTEGER NOT NULL,
fileName TEXT NOT NULL,
originalUrl TEXT NOT NULL,
croppedUrl TEXT,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (shootId) REFERENCES shoots(id) ON DELETE CASCADE
);