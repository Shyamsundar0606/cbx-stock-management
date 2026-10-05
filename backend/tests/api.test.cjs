const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { createApp } = require("../dist/app");
async function fixture(t, path = ":memory:", seed = false) {
  const { app, db } = createApp(path, seed);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) =>
        server.close(() => {
          db.close();
          resolve();
        }),
      ),
  );
  return async (url, method = "GET", body) => {
    const res = await fetch(
      `http://127.0.0.1:${server.address().port}/api${url}`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    return { status: res.status, body: await res.json() };
  };
}
const valid = {
  name: "Produit test",
  reference: "TEST-001",
  description: "Description",
  category: "Test",
  quantity: 5,
  threshold: 3,
};
test("create, search, detail, update and unique references", async (t) => {
  const request = await fixture(t);
  const created = await request("/products", "POST", valid);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(
    (await request("/products?search=TEST-001&category=Test")).body.length,
    1,
  );
  assert.equal(
    (await request(`/products/${id}`)).body.description,
    "Description",
  );
  assert.equal(
    (await request("/products", "POST", { ...valid, reference: "test-001" }))
      .status,
    409,
  );
  const updated = await request(`/products/${id}`, "PUT", {
    ...valid,
    name: "Modifié",
    threshold: 5,
  });
  assert.equal(updated.body.name, "Modifié");
  assert.equal((await request("/dashboard")).body.lowStock, 1);
  assert.equal((await request("/products/999")).status, 404);
  assert.equal((await request("/products/abc")).status, 400);
});
test("server validation rejects invalid and missing fields", async (t) => {
  const request = await fixture(t);
  for (const change of [
    { name: "" },
    { reference: " " },
    { category: "" },
    { quantity: -1 },
    { quantity: 1.2 },
    { quantity: "5" },
    { threshold: -1 },
    { quantity: 1000001 },
    { description: 42 },
  ])
    assert.equal(
      (await request("/products", "POST", { ...valid, ...change })).status,
      400,
    );
  assert.equal((await request("/products", "POST", {})).status, 400);
});
test("movements are atomic, traced and never permit negative inventory", async (t) => {
  const request = await fixture(t);
  const { body: p } = await request("/products", "POST", valid);
  assert.equal(
    (
      await request(`/products/${p.id}/movements`, "POST", {
        direction: "out",
        quantity: 6,
      })
    ).status,
    409,
  );
  assert.equal((await request(`/products/${p.id}/movements`)).body.length, 0);
  const results = await Promise.all(
    [1, 2].map(() =>
      request(`/products/${p.id}/movements`, "POST", {
        direction: "out",
        quantity: 4,
      }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await request(`/products/${p.id}`)).body.quantity, 1);
  assert.equal(
    (
      await request(`/products/${p.id}/movements`, "POST", {
        direction: "in",
        quantity: 0,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/products/${p.id}/movements`, "POST", {
        direction: "out",
        quantity: 1,
      })
    ).body.quantity,
    0,
  );
  assert.equal((await request("/dashboard")).body.outOfStock, 1);
  assert.equal((await request("/dashboard")).body.lowStock, 0);
  assert.equal(
    (
      await request(`/products/${p.id}/movements`, "POST", {
        direction: "in",
        quantity: 7,
      })
    ).body.quantity,
    7,
  );
  assert.equal((await request(`/products/${p.id}/movements`)).body.length, 3);
});
test("SQLite persistence survives reopening and seeds only once", async () => {
  const directory = mkdtempSync(join(tmpdir(), "cbx-test-"));
  const path = join(directory, "stock.sqlite");
  try {
    let f = createApp(path, true);
    assert.equal(f.db.prepare("SELECT COUNT(*) n FROM products").get().n, 6);
    f.db.prepare("UPDATE products SET quantity=999 WHERE id=1").run();
    f.db.close();
    f = createApp(path, true);
    assert.equal(
      f.db.prepare("SELECT quantity FROM products WHERE id=1").get().quantity,
      999,
    );
    assert.equal(f.db.prepare("SELECT COUNT(*) n FROM products").get().n, 6);
    f.db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
