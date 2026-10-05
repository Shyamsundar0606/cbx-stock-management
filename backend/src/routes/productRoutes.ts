import { Express } from "express";
import { DatabaseSync } from "node:sqlite";
import { ApiError, integer, validate } from "../controllers/productController";
export function registerProductRoutes(app: Express, db: DatabaseSync) {
  const product = (id: string) => {
    if (!/^\d+$/.test(id)) throw new ApiError(400, "Identifiant invalide.");
    const p = db.prepare("SELECT * FROM products WHERE id=?").get(Number(id));
    if (!p) throw new ApiError(404, "Produit introuvable.");
    return p;
  };
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/products", (req, res) => {
    const s = typeof req.query.search === "string" ? req.query.search : "";
    const c = typeof req.query.category === "string" ? req.query.category : "";
    res.json(
      db
        .prepare(
          "SELECT * FROM products WHERE (name LIKE ? OR reference LIKE ?) AND (?='' OR category=?) ORDER BY name COLLATE NOCASE",
        )
        .all(`%${s}%`, `%${s}%`, c, c),
    );
  });
  app.get("/api/dashboard", (_req, res) =>
    res.json({
      ...db
        .prepare(
          "SELECT COUNT(*) AS total, COALESCE(SUM(quantity=0),0) AS outOfStock, COALESCE(SUM(quantity>0 AND quantity<=threshold),0) AS lowStock, COALESCE(SUM(quantity),0) AS units FROM products",
        )
        .get(),
      categories: db
        .prepare(
          "SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY count DESC",
        )
        .all(),
    }),
  );
  app.get("/api/products/:id", (req, res) => res.json(product(req.params.id)));
  app.post("/api/products", (req, res) => {
    const p = validate(req.body || {});
    const result = db
      .prepare(
        "INSERT INTO products (name,reference,description,category,quantity,threshold,updatedAt) VALUES (?,?,?,?,?,?,?)",
      )
      .run(
        p.name,
        p.reference,
        p.description,
        p.category,
        p.quantity,
        p.threshold,
        new Date().toISOString(),
      );
    res.status(201).json(product(String(result.lastInsertRowid)));
  });
  app.put("/api/products/:id", (req, res) => {
    product(req.params.id);
    const p = validate(req.body || {});
    db.prepare(
      "UPDATE products SET name=?,reference=?,description=?,category=?,quantity=?,threshold=?,updatedAt=? WHERE id=?",
    ).run(
      p.name,
      p.reference,
      p.description,
      p.category,
      p.quantity,
      p.threshold,
      new Date().toISOString(),
      Number(req.params.id),
    );
    res.json(product(req.params.id));
  });
  app.get("/api/products/:id/movements", (req, res) => {
    product(req.params.id);
    res.json(
      db
        .prepare(
          "SELECT * FROM movements WHERE productId=? ORDER BY id DESC LIMIT 50",
        )
        .all(Number(req.params.id)),
    );
  });
  app.post("/api/products/:id/movements", (req, res) => {
    const { direction, quantity } = req.body || {};
    if (!["in", "out"].includes(direction) || !integer(quantity, 1))
      throw new ApiError(
        400,
        "Mouvement invalide : quantité entière strictement positive.",
      );
    db.exec("BEGIN IMMEDIATE");
    try {
      const p = product(req.params.id);
      const next =
        Number(p.quantity) + (direction === "in" ? quantity : -quantity);
      if (next < 0)
        throw new ApiError(409, "Stock insuffisant pour cette sortie.");
      if (next > 1000000)
        throw new ApiError(400, "Quantité maximale : 1 000 000.");
      const date = new Date().toISOString();
      db.prepare("UPDATE products SET quantity=?,updatedAt=? WHERE id=?").run(
        next,
        date,
        Number(req.params.id),
      );
      db.prepare(
        "INSERT INTO movements (productId,direction,quantity,createdAt) VALUES (?,?,?,?)",
      ).run(Number(req.params.id), direction, quantity, date);
      db.exec("COMMIT");
      res.status(201).json(product(req.params.id));
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  });
}
