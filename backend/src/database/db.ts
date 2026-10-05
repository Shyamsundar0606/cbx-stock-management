import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
export function openDatabase(
  path = process.env.DATABASE_PATH ||
    resolve(__dirname, "../../data/stock.sqlite"),
  seed = true,
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, reference TEXT NOT NULL COLLATE NOCASE UNIQUE, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 1000000), threshold INTEGER NOT NULL CHECK(threshold BETWEEN 0 AND 1000000), updatedAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER NOT NULL REFERENCES products(id), direction TEXT NOT NULL CHECK(direction IN ('in','out')), quantity INTEGER NOT NULL CHECK(quantity>0), createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  if (
    seed &&
    !db.prepare("SELECT key FROM metadata WHERE key='seeded'").get()
  ) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const insert = db.prepare(
        "INSERT OR IGNORE INTO products (name,reference,description,category,quantity,threshold,updatedAt) VALUES (?,?,?,?,?,?,?)",
      );
      for (const p of [
        [
          "Casque de protection",
          "SEC-001",
          "Casque de chantier réglable, coloris blanc.",
          "Sécurité",
          48,
          10,
        ],
        [
          "Gants de manutention",
          "SEC-002",
          "Gants renforcés, taille M.",
          "Sécurité",
          8,
          15,
        ],
        [
          "Perceuse sans fil",
          "OUT-001",
          "Perceuse 18 V avec batterie et chargeur.",
          "Outillage",
          12,
          5,
        ],
        [
          "Ruban adhésif",
          "CON-001",
          "Rouleau de conditionnement de 50 m.",
          "Consommables",
          0,
          20,
        ],
        [
          "Carton d’expédition",
          "EMB-001",
          "Carton double cannelure, 40 × 30 cm.",
          "Emballage",
          124,
          30,
        ],
        [
          "Clé à molette",
          "OUT-002",
          "Clé ajustable en acier, 250 mm.",
          "Outillage",
          6,
          6,
        ],
      ])
        insert.run(...p, new Date().toISOString());
      db.prepare("INSERT INTO metadata VALUES ('seeded','1')").run();
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return db;
}
