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

  // Start new initialization with retry for transient plugin errors on first launch
  initPromise = (async () => {
    const MAX_ATTEMPTS = 3
    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🗄️ Retrying database initialization (attempt ${attempt})...`)
          await new Promise(r => setTimeout(r, 400 * attempt))
        } else {
          console.log('🗄️ Initializing SQLite database...')
        }
        dbInstance = await initializeDatabase('cakecost.db')
        console.log('✓ Database initialized successfully')
        initPromise = null
        return dbInstance
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Database init attempt ${attempt} failed:`, error)
      }
    }
    console.error('❌ Database initialization failed after all attempts:', lastError)
    initPromise = null
    throw new Error('Database initialization failed. The app may not work correctly.')
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
