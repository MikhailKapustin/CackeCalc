import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

export interface Database {
  connection: SQLiteConnection
  db: SQLiteDBConnection | null
}

// SQL statements for table creation
export const SCHEMA_VERSION = 1

export const CREATE_INGREDIENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,

    -- Purchase data (as on store receipt)
    purchase_price REAL NOT NULL,      -- Purchase price (e.g., 120 rub)
    purchase_amount REAL NOT NULL,     -- Amount (e.g., 2 or 10)
    purchase_unit TEXT NOT NULL,       -- Unit ('kg', 'g', 'l', 'ml', 'pcs', 'tens')

    -- Measurement type
    type TEXT CHECK(type IN ('weight', 'volume', 'count')) NOT NULL,

    -- Calculated field: price per 1 base unit (g/ml/pcs)
    price_per_base_unit REAL NOT NULL,

    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`

export const CREATE_RECIPES_TABLE = `
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,

    -- Economics
    total_cost REAL DEFAULT 0,        -- Cost price (cache)
    selling_price REAL DEFAULT 0,     -- Selling price
    selling_unit TEXT CHECK(selling_unit IN ('kg', 'pcs')) DEFAULT 'kg',

    -- Calculated fields (cache for performance)
    profit_amount REAL DEFAULT 0,     -- Profit in currency
    profit_percent REAL DEFAULT 0,    -- Margin in percent

    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`

export const CREATE_RECIPE_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,

    -- Amount ALWAYS in base units (g, ml, pcs)
    amount REAL NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON recipe_items(ingredient_id);
`

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Always one row

    -- Main settings
    currency_symbol TEXT DEFAULT '$',
    language TEXT,  -- NULL = not set (first run, use browser locale)
    theme TEXT DEFAULT 'light',              -- 'light', 'dark', 'auto'

    -- Receipt branding settings (Pro version)
    receipt_logo_path TEXT,                -- Path to logo file
    receipt_logo_opacity INTEGER DEFAULT 100,  -- Logo opacity (0-100)
    receipt_logo_position TEXT DEFAULT 'center', -- 'center', 'watermark'
    receipt_bg_color TEXT DEFAULT '#FFFFFF',    -- HEX background color
    receipt_bg_opacity INTEGER DEFAULT 100,     -- Background opacity (0-100)
    receipt_text_color TEXT DEFAULT '#000000',  -- HEX text color

    -- Confectioner's contacts for receipt (Pro version)
    receipt_business_name TEXT,           -- Business name
    receipt_phone TEXT,                   -- Phone
    receipt_instagram TEXT,               -- Instagram handle
    receipt_website TEXT,                 -- Website

    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`

export const INSERT_DEFAULT_SETTINGS = `
INSERT OR IGNORE INTO settings (id) VALUES (1);
`

// IMPORTANT: is_pro flag is NOT stored in SQLite!
// It's stored in Secure Storage via Secure Storage (Keychain/KeyStore)

/**
 * Create database and run migrations
 */
export async function createDatabase(dbName: string = ':memory:'): Promise<SQLiteDBConnection> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)

  const db = await sqlite.createConnection(
    dbName,
    false, // encrypted
    'no-encryption',
    SCHEMA_VERSION,
    false // readonly
  )

  await db.open()

  return db
}

/**
 * Run all migrations
 */
export async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  await db.execute(CREATE_INGREDIENTS_TABLE)
  await db.execute(CREATE_RECIPES_TABLE)
  await db.execute(CREATE_RECIPE_ITEMS_TABLE)
  await db.execute(CREATE_SETTINGS_TABLE)
  await db.execute(INSERT_DEFAULT_SETTINGS)
}

/**
 * Initialize database with schema
 */
export async function initializeDatabase(dbName: string = 'cakecost.db'): Promise<SQLiteDBConnection> {
  const db = await createDatabase(dbName)
  await runMigrations(db)
  return db
}
