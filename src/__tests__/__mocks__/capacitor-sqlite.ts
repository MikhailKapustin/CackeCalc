import { vi } from 'vitest'

// Mock implementation of SQLite for testing
class MockSQLiteDBConnection {
  private tables: Map<string, any[]> = new Map()
  private schema: Map<string, any[]> = new Map()
  private indexes: Map<string, string> = new Map()

  async open() {
    return true
  }

  async close() {
    return true
  }

  async execute(sql: string) {
    // Handle multiple statements separated by semicolons
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      await this.executeSingleStatement(statement.trim())
    }

    return { changes: { changes: 1 } }
  }

  private async executeSingleStatement(sql: string) {
    if (sql.includes('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([\s\S]+)\)/i)
      if (match) {
        const tableName = match[1]
        const columnsText = match[2]
        this.tables.set(tableName, [])

        // Parse column definitions better
        const columns: any[] = []
        const lines = columnsText.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          // Skip comments, empty lines, constraints, and foreign keys
          if (!trimmed || trimmed.startsWith('--') ||
              trimmed.match(/^(FOREIGN KEY|PRIMARY KEY|CHECK|CONSTRAINT)/i)) {
            continue
          }

          // Extract column name
          const colMatch = trimmed.match(/^(\w+)\s+/i)
          if (colMatch && !trimmed.startsWith('FOREIGN')) {
            columns.push({ name: colMatch[1] })
          }
        }
        this.schema.set(tableName, columns)
      }
    } else if (sql.includes('CREATE INDEX')) {
      const match = sql.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+) ON (\w+)/i)
      if (match) {
        const indexName = match[1]
        const tableName = match[2]
        this.indexes.set(indexName, tableName)
      }
    } else if (sql.includes('INSERT')) {
      const match = sql.match(/INSERT (?:OR IGNORE )?INTO (\w+)/i)
      if (match) {
        const tableName = match[1]
        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, [])
        }

        if (tableName === 'settings') {
          this.tables.set(tableName, [{
            id: 1,
            currency_symbol: '₽',
            language: 'en',
            theme: 'light',
            receipt_bg_color: '#FFFFFF',
            receipt_text_color: '#000000',
            receipt_logo_opacity: 100,
            receipt_bg_opacity: 100,
            receipt_logo_position: 'center'
          }])
        }
      }
    }
  }

  async query(sql: string, values?: any[]) {
    // Handle SELECT queries
    if (sql.includes('sqlite_master')) {
      if (sql.includes("type='index'")) {
        // Extract table name if specified
        const tableMatch = sql.match(/tbl_name='(\w+)'/)
        if (tableMatch) {
          const tableName = tableMatch[1]
          const tableIndexes = Array.from(this.indexes.entries())
            .filter(([_, tbl]) => tbl === tableName)
            .map(([name, _]) => ({ name }))
          return { values: tableIndexes }
        }
        // Return all indexes
        const allIndexes = Array.from(this.indexes.keys()).map(name => ({ name }))
        return { values: allIndexes }
      }

      if (sql.includes("type='table'")) {
        const tableName = sql.match(/name='(\w+)'/)
        if (tableName && this.tables.has(tableName[1])) {
          return { values: [{ name: tableName[1] }] }
        }
        // Return all tables
        const tables = Array.from(this.tables.keys()).map(name => ({ name }))
        return { values: tables }
      }
    }

    if (sql.includes('PRAGMA table_info')) {
      const match = sql.match(/table_info\((\w+)\)/)
      if (match && this.schema.has(match[1])) {
        return { values: this.schema.get(match[1]) }
      }
      return { values: [] }
    }

    if (sql.includes('PRAGMA foreign_key_list')) {
      // Mock foreign keys for recipe_items
      return {
        values: [
          { table: 'recipes', from: 'recipe_id', to: 'id' },
          { table: 'ingredients', from: 'ingredient_id', to: 'id' }
        ]
      }
    }

    if (sql.includes('SELECT') && sql.includes('settings')) {
      const settingsData = this.tables.get('settings') || []
      return { values: settingsData }
    }

    if (sql.includes('SELECT') && sql.includes('ingredients')) {
      const ingredientsData = this.tables.get('ingredients') || []
      return { values: ingredientsData }
    }

    return { values: [] }
  }

  async run(sql: string, values?: any[]) {
    // Handle INSERT/UPDATE/DELETE
    if (sql.includes('INSERT INTO ingredients')) {
      const ingredientsData = this.tables.get('ingredients') || []
      const newId = ingredientsData.length + 1

      // Create ingredient object from values if provided
      const newIngredient: any = {
        id: newId,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      }

      // Map values to columns based on typical INSERT statement
      if (values && values.length >= 6) {
        newIngredient.name = values[0]
        newIngredient.purchase_price = values[1]
        newIngredient.purchase_amount = values[2]
        newIngredient.purchase_unit = values[3]
        newIngredient.type = values[4]
        newIngredient.price_per_base_unit = values[5]
      }

      ingredientsData.push(newIngredient)
      this.tables.set('ingredients', ingredientsData)
      return { changes: { changes: 1, lastId: newId } }
    }

    if (sql.includes('UPDATE ingredients')) {
      const ingredientsData = this.tables.get('ingredients') || []

      if (values && values.length >= 7) {
        const id = values[6] // Last parameter is the id
        const index = ingredientsData.findIndex((ing: any) => ing.id === id)

        if (index !== -1) {
          ingredientsData[index] = {
            ...ingredientsData[index],
            name: values[0],
            purchase_price: values[1],
            purchase_amount: values[2],
            purchase_unit: values[3],
            type: values[4],
            price_per_base_unit: values[5],
            updated_at: Math.floor(Date.now() / 1000)
          }
        }
      }

      return { changes: { changes: 1 } }
    }

    if (sql.includes('DELETE FROM ingredients')) {
      const ingredientsData = this.tables.get('ingredients') || []

      if (values && values.length > 0) {
        const id = values[0]
        const filtered = ingredientsData.filter((ing: any) => ing.id !== id)
        this.tables.set('ingredients', filtered)
      }

      return { changes: { changes: 1 } }
    }

    if (sql.includes('INSERT INTO settings')) {
      // Check for id constraint
      if (sql.includes('id') && !sql.includes('id = 1')) {
        throw new Error('CHECK constraint failed: id must be 1')
      }
    }

    if (sql.includes('INSERT INTO recipes')) {
      if (sql.includes('invalid_unit')) {
        throw new Error('CHECK constraint failed: selling_unit')
      }
    }

    if (sql.includes('INSERT INTO ingredients') && sql.includes('invalid_type')) {
      throw new Error('CHECK constraint failed: type')
    }

    return { changes: { changes: 1 } }
  }
}

export class MockSQLiteConnection {
  async createConnection(
    database: string,
    encrypted: boolean,
    mode: string,
    version: number,
    readonly: boolean
  ) {
    return new MockSQLiteDBConnection()
  }
}

export const CapacitorSQLite = {}
export const SQLiteConnection = MockSQLiteConnection
export type SQLiteDBConnection = MockSQLiteDBConnection
