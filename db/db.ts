import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import path from 'path';

// Define a type alias for the database instance
export type MyDatabase = SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

/**
 * Opens a connection to the SQLite database.
 * @returns A promise that resolves to the database instance.
 */
export async function openDb(): Promise<MyDatabase> {
  return open({
    filename: path.join(process.cwd(), 'costumes.sqlite'),
    driver: sqlite3.Database
  });
}