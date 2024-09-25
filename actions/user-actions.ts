import { openDb } from '@/db/db';

export async function getUsers() {
  const db = await openDb();
  try {
    const users = await db.all('SELECT id, firstName, lastName FROM users ORDER BY lastName, firstName');
    return users;
  } catch (error) {
    console.error('\x1b[36m /actions/user-actions.ts getUsers error:\x1b[0m', error);
    throw new Error('Failed to fetch users');
  } finally {
    await db.close();
  }
}