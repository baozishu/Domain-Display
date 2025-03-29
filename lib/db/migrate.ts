import { getDb } from "./index"
import { schema } from "./schema"

// Run migrations
export async function runMigrations() {
  const db = await getDb()

  // Create tables if they don't exist
  for (const [table, query] of Object.entries(schema)) {
    await db.exec(query)
    console.log(`✅ Table ${table} migrated successfully`)
  }

  // Add any future migrations here
  // Example: await db.exec(`ALTER TABLE domains ADD COLUMN new_column TEXT`)

  return true
}

// Check if migrations are needed
export async function checkMigrations() {
  const db = await getDb()

  try {
    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)

    const tableNames = tables.map((t) => t.name)
    const schemaTableNames = Object.keys(schema)

    // Check if all schema tables exist
    const missingTables = schemaTableNames.filter((name) => !tableNames.includes(name))

    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(", ")}`)
      return true
    }

    // Additional checks could be added here for column changes

    return false
  } catch (error) {
    console.error("Error checking migrations:", error)
    return true
  }
}

