import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { openDatabase } from "./database/db";
import { ApiError } from "./controllers/productController";
import { registerProductRoutes } from "./routes/productRoutes";
export function createApp(path?: string, seed = true) {
  const db = openDatabase(path, seed);
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  registerProductRoutes(app, db);
  app.use((_req, _res, next) => next(new ApiError(404, "Route introuvable.")));
  app.use(
    (
      e: Error & { type?: string },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (e instanceof ApiError) {
        res.status(e.status).json({ message: e.message });
        return;
      }
      if (e.message.includes("UNIQUE constraint failed")) {
        res.status(409).json({ message: "Cette référence existe déjà." });
        return;
      }
      if (["entity.parse.failed", "entity.too.large"].includes(e.type || "")) {
        res
          .status(400)
          .json({ message: "Corps JSON invalide ou trop volumineux." });
        return;
      }
      console.error(e);
      res.status(500).json({ message: "Erreur interne du serveur." });
    },
  );
  return { app, db };
}
