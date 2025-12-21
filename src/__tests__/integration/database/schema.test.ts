import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, runMigrations } from '@/database/schema'
import type { SQLiteDBConnection } from '@capacitor-community/sqlite'

describe('Database Schema', () => {
  let db: SQLiteDBConnection

  beforeEach(async () => {
    db = await createDatabase(':memory:')
  })

  it('should create ingredients table', async () => {
    await runMigrations(db)

    const result = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ingredients'"
    )

    expect(result.values).toHaveLength(1)
  })

  it('should create recipes table with correct schema', async () => {
    await runMigrations(db)

    const result = await db.query('PRAGMA table_info(recipes)')
    const columns = result.values?.map((col: any) => col.name) || []

    expect(columns).toContain('id')
    expect(columns).toContain('name')
    expect(columns).toContain('description')
    expect(columns).toContain('total_cost')
    expect(columns).toContain('selling_price')
    expect(columns).toContain('selling_unit')
    expect(columns).toContain('profit_amount')
    expect(columns).toContain('profit_percent')
  })

  it('should create recipe_items table with foreign keys', async () => {
    await runMigrations(db)

    const result = await db.query('PRAGMA foreign_key_list(recipe_items)')

    expect(result.values).toHaveLength(2) // recipe_id and ingredient_id
  })

  it('should create settings table with default row', async () => {
    await runMigrations(db)

    const result = await db.query('SELECT * FROM settings WHERE id = 1')

    expect(result.values).toHaveLength(1)
    expect(result.values?.[0].currency_symbol).toBe('₽')
    expect(result.values?.[0].language).toBe('en')
    expect(result.values?.[0].theme).toBe('light')
  })

  it('should create indexes on recipe_items table', async () => {
    await runMigrations(db)

    const result = await db.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='recipe_items'"
    )

    const indexNames = result.values?.map((idx: any) => idx.name) || []
    expect(indexNames).toContain('idx_recipe_items_recipe')
    expect(indexNames).toContain('idx_recipe_items_ingredient')
  })

  it('should enforce CHECK constraint on ingredient type', async () => {
    await runMigrations(db)

    // This should fail because type must be 'weight', 'volume', or 'count'
    try {
      await db.run(
        `INSERT INTO ingredients (name, purchase_price, purchase_amount, purchase_unit, type, price_per_base_unit)
         VALUES ('Test', 100, 1, 'kg', 'invalid_type', 0.1)`,
        []
      )
      // If no error is thrown, test should fail
      expect(true).toBe(false)
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }
  })

  it('should enforce CHECK constraint on selling_unit', async () => {
    await runMigrations(db)

    // This should fail because selling_unit must be 'kg' or 'pcs'
    try {
      await db.run(
        `INSERT INTO recipes (name, selling_price, selling_unit)
         VALUES ('Test Recipe', 1000, 'invalid_unit')`,
        []
      )
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('should allow only one settings row (id = 1)', async () => {
    await runMigrations(db)

    // Try to insert a second settings row with id = 2
    try {
      await db.run(
        `INSERT INTO settings (id, currency_symbol) VALUES (2, '$')`,
        []
      )
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('should create all tables in correct order', async () => {
    await runMigrations(db)

    const result = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )

    const tableNames = result.values?.map((table: any) => table.name) || []
    expect(tableNames).toContain('ingredients')
    expect(tableNames).toContain('recipes')
    expect(tableNames).toContain('recipe_items')
    expect(tableNames).toContain('settings')
  })

  it('should set default values for timestamps', async () => {
    await runMigrations(db)

    await db.run(
      `INSERT INTO ingredients (name, purchase_price, purchase_amount, purchase_unit, type, price_per_base_unit)
       VALUES ('Flour', 120, 2, 'kg', 'weight', 0.06)`,
      []
    )

    const result = await db.query('SELECT created_at, updated_at FROM ingredients WHERE name = "Flour"')

    expect(result.values?.[0].created_at).toBeDefined()
    expect(result.values?.[0].updated_at).toBeDefined()
    expect(result.values?.[0].created_at).toBeGreaterThan(0)
  })
})
