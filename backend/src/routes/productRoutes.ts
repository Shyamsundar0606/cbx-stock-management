import { Express } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { ApiError, isValidQuantity, validateProduct } from '../controllers/productController';

export function registerProductRoutes(app: Express, db: DatabaseSync) {
  const findProduct = (id: string) => {
    if (!/^\d+$/.test(id)) {
      throw new ApiError(400, 'Invalid product ID.');
    }
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(id));
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }
    return product;
  };

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/products', (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    res.json(
      db
        .prepare(
          `
          SELECT * FROM products
          WHERE (name LIKE ? OR reference LIKE ?)
            AND (? = '' OR category = ?)
          ORDER BY name COLLATE NOCASE
        `,
        )
        .all(`%${search}%`, `%${search}%`, category, category),
    );
  });

  app.get('/api/dashboard', (_req, res) =>
    res.json({
      ...db
        .prepare(
          `
          SELECT COUNT(*) AS total,
            COALESCE(SUM(quantity = 0), 0) AS outOfStock,
            COALESCE(SUM(quantity > 0 AND quantity <= threshold), 0) AS lowStock,
            COALESCE(SUM(quantity), 0) AS units
          FROM products
        `,
        )
        .get(),
      categories: db
        .prepare(
          'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY count DESC',
        )
        .all(),
    }),
  );

  app.get('/api/products/:id', (req, res) => res.json(findProduct(req.params.id)));

  app.post('/api/products', (req, res) => {
    const product = validateProduct(req.body || {});
    const result = db
      .prepare(
        'INSERT INTO products (name,reference,description,category,quantity,threshold,updatedAt) VALUES (?,?,?,?,?,?,?)',
      )
      .run(
        product.name,
        product.reference,
        product.description,
        product.category,
        product.quantity,
        product.threshold,
        new Date().toISOString(),
      );
    res.status(201).json(findProduct(String(result.lastInsertRowid)));
  });

  app.put('/api/products/:id', (req, res) => {
    findProduct(req.params.id);
    const product = validateProduct(req.body || {});
    db.prepare(
      'UPDATE products SET name=?,reference=?,description=?,category=?,quantity=?,threshold=?,updatedAt=? WHERE id=?',
    ).run(
      product.name,
      product.reference,
      product.description,
      product.category,
      product.quantity,
      product.threshold,
      new Date().toISOString(),
      Number(req.params.id),
    );
    res.json(findProduct(req.params.id));
  });

  app.get('/api/products/:id/movements', (req, res) => {
    findProduct(req.params.id);
    res.json(
      db
        .prepare('SELECT * FROM movements WHERE productId=? ORDER BY id DESC LIMIT 50')
        .all(Number(req.params.id)),
    );
  });

  app.post('/api/products/:id/movements', (req, res) => {
    const { direction, quantity } = req.body || {};
    if (!['in', 'out'].includes(direction) || !isValidQuantity(quantity, 1)) {
      throw new ApiError(400, 'Choose a valid direction and a positive whole-number quantity.');
    }
    // Keep the quantity change and its history entry in the same transaction.
    db.exec('BEGIN IMMEDIATE');
    try {
      const product = findProduct(req.params.id);
      const updatedQuantity =
        Number(product.quantity) + (direction === 'in' ? quantity : -quantity);
      if (updatedQuantity < 0) {
        throw new ApiError(409, 'There is not enough stock to remove that quantity.');
      }
      if (updatedQuantity > 1_000_000) {
        throw new ApiError(400, 'Stock cannot exceed 1,000,000 units.');
      }
      const updatedAt = new Date().toISOString();
      db.prepare('UPDATE products SET quantity=?,updatedAt=? WHERE id=?').run(
        updatedQuantity,
        updatedAt,
        Number(req.params.id),
      );
      db.prepare(
        'INSERT INTO movements (productId,direction,quantity,createdAt) VALUES (?,?,?,?)',
      ).run(Number(req.params.id), direction, quantity, updatedAt);
      db.exec('COMMIT');
      res.status(201).json(findProduct(req.params.id));
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  });
}
