DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS shoots;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS preprocessed_images;
DROP TABLE IF EXISTS loras;
DROP TABLE IF EXISTS generated_images;
DROP TABLE IF EXISTS generation_prompts;
DROP TABLE IF EXISTS p_backgrounds;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  ethnicity TEXT NOT NULL,
  gender TEXT NOT NULL,
  birthdate DATE NOT NULL,
  trigger TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
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

-- We have gotten rid of shoots and are in the process of removing it from the database and our logic.
-- CREATE TABLE IF NOT EXISTS shoots (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL,
--   costumeGender TEXT NOT NULL,
--   costume TEXT NOT NULL,
--   backdrop TEXT,
--   personId INTEGER,
--   created_at DATETIME DEFAULT (datetime('now')),
--   updated_at DATETIME DEFAULT (datetime('now')),
--   FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE SET NULL
-- );

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personId INTEGER NOT NULL,
  fileName TEXT NOT NULL,
  originalUrl TEXT NOT NULL,
  croppedUrl TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preprocessed_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  imageId INTEGER NOT NULL,
  beforeFileName TEXT NOT NULL,
  afterFileName TEXT NOT NULL,
  preprocessedUrl TEXT NOT NULL,
  caption TEXT,
  llm TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
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
  generatedPromptId INTEGER, -- id of the prompt used to generate the image
  seed INTEGER,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (loraId) REFERENCES loras(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS p_backgrounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  background TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generation_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personId INTEGER NOT NULL,
  loraId INTEGER NOT NULL,
  userInput TEXT NOT NULL,
  backgroundId INTEGER NOT NULL,
  generatedImageId INTEGER,
  generatedPrompt TEXT,
  fullPrompt TEXT,
  llm TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (loraId) REFERENCES loras(id) ON DELETE CASCADE,
  FOREIGN KEY (backgroundId) REFERENCES p_backgrounds(id) ON DELETE CASCADE,
  FOREIGN KEY (generatedImageId) REFERENCES generated_images(id) ON DELETE SET NULL
);

