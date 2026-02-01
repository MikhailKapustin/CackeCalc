import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { initializeDatabase } from './schema'

let dbInstance: SQLiteDBConnection | null = null
let initPromise: Promise<SQLiteDBConnection> | null = null

/**
 * Get database instance (singleton)
 * Initializes database on first call
 * Handles concurrent calls safely with a promise lock
 */
export async function getDatabase(): Promise<SQLiteDBConnection> {
  // If already initialized, return instance
  if (dbInstance) {
    return dbInstance
  }

  // If initialization in progress, wait for it
  if (initPromise) {
    console.log('🔔 Database initialization in progress, waiting...')
    return initPromise
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      console.log('🗄️ Initializing SQLite database...')
      dbInstance = await initializeDatabase('cakecost.db')
      console.log('✓ Database initialized successfully')
      return dbInstance
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      // Clear the promise so next call can retry
      initPromise = null
      throw new Error('Database initialization failed. The app may not work correctly.')
    } finally {
      // Clear the promise once initialization is complete
      initPromise = null
    }
  })()

  return initPromise
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
