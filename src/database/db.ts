import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { initializeDatabase } from './schema'

let dbInstance: SQLiteDBConnection | null = null

/**
 * Get database instance (singleton)
 * Initializes database on first call
 */
export async function getDatabase(): Promise<SQLiteDBConnection> {
  if (!dbInstance) {
    try {
      console.log('🗄️ Initializing SQLite database...')
      dbInstance = await initializeDatabase('cakecost.db')
      console.log('✓ Database initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw new Error('Database initialization failed. The app may not work correctly.')
    }
  }
  return dbInstance
}

/**
 * Close database connection
 * Useful for testing and cleanup
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
  }
}

/**
 * Reset database instance
 * Useful for testing
 */
export function resetDatabaseInstance(): void {
  dbInstance = null
}
