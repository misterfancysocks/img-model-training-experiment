import { openDb } from '../db';
import { ShootData, PersonData, ImageData, PreprocessedImageData, LoraData, GeneratedImageData, LoraPromptData } from '../schema/schema';
import { Database } from 'sqlite';
import path from 'path';

export async function getLatestShoot(): Promise<ShootData | null> {
  const db = await openDb();
  try {
    const shoot = await db.get<ShootData>(`
      SELECT * FROM shoots
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return shoot || null;
  } finally {
    await db.close();
  }
}

export async function getShoots(): Promise<ShootData[]> {
  const db = await openDb();
  try {
    const shoots = await db.all<ShootData[]>(`
      SELECT * FROM shoots
      ORDER BY created_at DESC
    `);
    return shoots;
  } finally {
    await db.close();
  }
}

export async function saveShootToDb(person: PersonData, shoot: ShootData): Promise<ShootData> {
  const db = await openDb();
  try {
    await db.run('BEGIN TRANSACTION');

    // Insert person
    const personResult = await db.run(`
      INSERT INTO persons (firstName, lastName, ethnicity, gender, age)
      VALUES (?, ?, ?, ?, ?)
    `, [person.firstName, person.lastName, person.ethnicity, person.gender, person.age]);

    // Insert shoot
    const shootResult = await db.run(`
      INSERT INTO shoots (name, costumeGender, costume, backdrop, personId)
      VALUES (?, ?, ?, ?, ?)
    `, [shoot.name, shoot.costumeGender, shoot.costume, shoot.backdrop, personResult.lastID]);

    await db.run('COMMIT');

    const savedShoot = await db.get(`SELECT * FROM shoots WHERE id = ?`, shootResult.lastID);
    return savedShoot;
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error in saveShootToDb:', error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function saveImages(
  shootId: number,
  images: { fileName: string; originalUrl: string; croppedUrl?: string }[]
): Promise<void> {
  const db = await openDb();
  try {
    await db.run('BEGIN TRANSACTION');

    for (const image of images) {
      await db.run(`
        INSERT OR REPLACE INTO images (shootId, fileName, originalUrl, croppedUrl)
        VALUES (?, ?, ?, ?)
      `, [shootId, image.fileName, image.originalUrl, image.croppedUrl || null]);
    }

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  } finally {
    await db.close();
  }
}

export async function getExistingShoots(db: Database) {
  const shoots = await db.all('SELECT * FROM shoots');
  return shoots;
}

export async function updatePersonAndShoot(shootId: number, person: PersonData, shoot: ShootData): Promise<void> {
  const db = await openDb();
  try {
    await db.run('BEGIN TRANSACTION');

    // Update person
    await db.run(`
      UPDATE persons
      SET firstName = ?, lastName = ?, ethnicity = ?, gender = ?, age = ?
      WHERE id = (SELECT personId FROM shoots WHERE id = ?)
    `, [person.firstName, person.lastName, person.ethnicity, person.gender, person.age, shootId]);

    // Update shoot
    await db.run(`
      UPDATE shoots
      SET name = ?, costumeGender = ?, costume = ?, backdrop = ?
      WHERE id = ?
    `, [shoot.name, shoot.costumeGender, shoot.costume, shoot.backdrop, shootId]);

    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error in updatePersonAndShoot:', error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function updateShootWithImages(shootId: number, images: { fileName: string; originalUrl: string; croppedUrl?: string }[]): Promise<any> {
  const db = await openDb();
  try {
    await db.run('BEGIN TRANSACTION');

    // Delete existing images for this shoot
    await db.run('DELETE FROM images WHERE shootId = ?', shootId);

    // Insert new images
    for (const image of images) {
      await db.run(
        'INSERT INTO images (shootId, fileName, originalUrl, croppedUrl) VALUES (?, ?, ?, ?)',
        shootId, image.fileName, image.originalUrl, image.croppedUrl || null
      );
    }

    await db.run('COMMIT');
    return { success: true, message: 'Images updated successfully' };
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error updating shoot with images:', error);
    throw error;
  } finally {
    await db.close();
  }
}

export async function getShootDetailsFromDb(shootId: number): Promise<{ person: PersonData; shoot: ShootData; images: ImageData[]; preprocessedImages: PreprocessedImageData[]; loras: LoraData[]; generatedImages: GeneratedImageData[]; loraPrompts: LoraPromptData[] } | null> {
  const db = await openDb();
  try {
    const shoot = await db.get<ShootData>('SELECT * FROM shoots WHERE id = ?', shootId);
    if (!shoot) return null;

    const person = await db.get<PersonData>('SELECT * FROM persons WHERE id = ?', shoot.personId);
    if (!person) return null;

    const images = await db.all<ImageData[]>('SELECT * FROM images WHERE shootId = ?', shootId);

    const preprocessedImages = await db.all<PreprocessedImageData[]>('SELECT * FROM preprocessed_images WHERE shootId = ?', shootId);

    const loras = await db.all<LoraData[]>('SELECT * FROM loras WHERE personId = ?', person.id);

    const generatedImages = await db.all<GeneratedImageData[]>(`
      SELECT gi.* FROM generated_images gi
      JOIN loras l ON gi.loraId = l.id
      WHERE l.personId = ?
    `, person.id);

    const loraPrompts = await db.all<LoraPromptData[]>(`
      SELECT * FROM lora_prompts
      WHERE personId = ? AND shootId = ?
    `, person.id, shootId);

    const modifiedImages = images.map(img => ({
      ...img,
      originalUrl: `/assets/${shootId}/${path.basename(img.originalUrl)}`,
      croppedUrl: img.croppedUrl ? `/assets/${shootId}/${path.basename(img.croppedUrl)}` : null
    }));

    return { 
      person, 
      shoot, 
      images: modifiedImages as ImageData[], 
      preprocessedImages,
      loras,
      generatedImages,
      loraPrompts
    };
  } finally {
    await db.close();
  }
}

export async function deleteImage(shootId: number, imageUrl: string) {
  const db = await openDb();
  try {
    await db.run('DELETE FROM images WHERE shootId = ? AND (originalUrl = ? OR croppedUrl = ?)', [shootId, imageUrl, imageUrl]);
    // TODO: Add logic to delete the actual image file from your storage system
  } finally {
    await db.close();
  }
}

export async function savePreprocessedImage(
  shootId: number,
  imageId: number,
  beforeFileName: string,
  afterFileName: string,
  preprocessedUrl: string,
  caption?: string,
  llm: string = 'Claude-3-Haiku' // Default value for the LLM used
): Promise<any> {
  const db = await openDb();
  try {
    const result = await db.run(`
      INSERT INTO preprocessed_images (shootId, imageId, beforeFileName, afterFileName, preprocessedUrl, caption, llm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [shootId, imageId, beforeFileName, afterFileName, preprocessedUrl, caption, llm]);
    return result;
  } finally {
    await db.close();
  }
}

export async function saveLoraToDB(
  personId: number,
  url: string,
  trainedOn: Date,
  service: string,
  model: string,
  modelVersion: string
): Promise<any> {
  const db = await openDb();
  try {
    const result = await db.run(`
      INSERT INTO loras (personId, url, trainedOn, service, model, modelVersion)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [personId, url, trainedOn.toISOString(), service, model, modelVersion]);
    return result;
  } finally {
    await db.close();
  }
}

export async function saveGeneratedImageToDB(
  loraId: number,
  imageUrl: string,
  prompt?: string,
  negativePrompt?: string,
  seed?: number
): Promise<any> {
  const db = await openDb();
  try {
    const result = await db.run(`
      INSERT INTO generated_images (loraId, imageUrl, prompt, negativePrompt, seed)
      VALUES (?, ?, ?, ?, ?)
    `, [loraId, imageUrl, prompt, negativePrompt, seed]);
    return result;
  } finally {
    await db.close();
  }
}

export async function saveLoraPromptToDB(
  personId: number,
  shootId: number,
  loraId: number,
  prompt: string,
  negativePrompt?: string,
  generatedImageId?: number
): Promise<any> {
  const db = await openDb();
  try {
    const result = await db.run(`
      INSERT INTO lora_prompts (personId, shootId, loraId, prompt, negativePrompt, generatedImageId)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [personId, shootId, loraId, prompt, negativePrompt, generatedImageId]);
    return result;
  } finally {
    await db.close();
  }
}

export async function getPersonDataForShoot(shootId: number): Promise<PersonData | null> {
  const db = await openDb();
  try {
    const person = await db.get<PersonData>(`
      SELECT p.* FROM persons p
      JOIN shoots s ON s.personId = p.id
      WHERE s.id = ?
    `, shootId);
    return person || null;
  } finally {
    await db.close();
  }
}