DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS shoots;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS preprocessed_images;
DROP TABLE IF EXISTS loras;
DROP TABLE IF EXISTS generated_images;
DROP TABLE IF EXISTS lora_prompts;

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS persons (
id INTEGER PRIMARY KEY AUTOINCREMENT,
firstName TEXT NOT NULL,
lastName TEXT NOT NULL,
ethnicity TEXT NOT NULL,
gender TEXT NOT NULL,
age INTEGER NOT NULL,
trigger TEXT,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TRIGGER generate_trigger_uid
AFTER INSERT ON persons
FOR EACH ROW
WHEN NEW.trigger IS NULL
BEGIN
   UPDATE persons 
   SET trigger = (SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
               substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
               substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
               substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
               substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1))
   WHERE id = NEW.id;
END;

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

CREATE TABLE IF NOT EXISTS preprocessed_images (
id INTEGER PRIMARY KEY AUTOINCREMENT,
shootId INTEGER NOT NULL,
imageId INTEGER NOT NULL,
beforeFileName TEXT NOT NULL,
afterFileName TEXT NOT NULL,
preprocessedUrl TEXT NOT NULL,
caption TEXT,
llm TEXT,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (shootId) REFERENCES shoots(id) ON DELETE CASCADE,
FOREIGN KEY (imageId) REFERENCES images(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loras (
id INTEGER PRIMARY KEY AUTOINCREMENT,
personId INTEGER NOT NULL,
url TEXT NOT NULL,
trainedOn DATETIME NOT NULL,
service TEXT NOT NULL,
model TEXT NOT NULL,
modelVersion TEXT NOT NULL,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generated_images (
id INTEGER PRIMARY KEY AUTOINCREMENT,
loraId INTEGER NOT NULL,
fullUrl TEXT NOT NULL, -- https://storage.googleapis.com/{bucket}/{path}
bucket TEXT NOT NULL, -- bucket the file was saved to
path TEXT NOT NULL, -- path to the file without the bucket
prompt TEXT,
negativePrompt TEXT,
seed INTEGER,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (loraId) REFERENCES loras(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lora_prompts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
personId INTEGER NOT NULL,
shootId INTEGER NOT NULL,
loraId INTEGER NOT NULL,
generatedImageId INTEGER,
prompt TEXT NOT NULL,
negativePrompt TEXT,
created_at DATETIME DEFAULT (datetime('now')),
updated_at DATETIME DEFAULT (datetime('now')),
FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE,
FOREIGN KEY (shootId) REFERENCES shoots(id) ON DELETE CASCADE,
FOREIGN KEY (loraId) REFERENCES loras(id) ON DELETE CASCADE,
FOREIGN KEY (generatedImageId) REFERENCES generated_images(id) ON DELETE SET NULL
);