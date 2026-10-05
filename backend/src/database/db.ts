import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sampleProducts } from './seed';

export function openDatabase(
  path = process.env.DATABASE_PATH || resolve(__dirname, '../../data/stock.sqlite'),
  seed = true,
) {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      reference TEXT NOT NULL COLLATE NOCASE UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 1000000),
      threshold INTEGER NOT NULL CHECK(threshold BETWEEN 0 AND 1000000),
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL REFERENCES products(id),
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  if (seed) {
    seedDatabase(db);
  }
  return db;
}

function seedDatabase(db: DatabaseSync) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const alreadySeeded = db.prepare("SELECT key FROM metadata WHERE key = 'seeded'").get();
    if (alreadySeeded) {
      db.exec('COMMIT');
      return;
    }

    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products
        (name, reference, description, category, quantity, threshold, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of sampleProducts) {
      insertProduct.run(
        product.name,
        product.reference,
        product.description,
        product.category,
        product.quantity,
        product.threshold,
        new Date().toISOString(),
      );
    }
    db.prepare("INSERT INTO metadata VALUES ('seeded', '1')").run();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
