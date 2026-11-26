// Fabrique l'application Express (SANS la démarrer).
// Séparée de server.ts pour que les tests puissent l'utiliser.
import express from "express";
import type { Container } from "./container.js";
import { authErrorHandler, installSecurity } from "./fourni/auth/index.js";
import { createMenuRouter } from "./modules/menu/routes.js";
import { errorHandler, notFound } from "./shared/errors.js";

export function createApp(container: Container) {
  const app = express();

  // 1. Sécurité (helmet, cors, lecture du JSON) : AVANT les routes
  installSecurity(app, { corsOrigin: container.config.CORS_ORIGIN });

  // 2. Les routes
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/auth", container.auth.router);
  app.use(createMenuRouter(container.menuController)); // /categories, /allergens, /dishes

  // 3. Aucune route n'a répondu -> 404
  app.use(notFound);

  // 4. Les gestionnaires d'erreurs : TOUJOURS à la fin
  app.use(authErrorHandler); // les erreurs du module d'auth
  app.use(errorHandler); // toutes les autres

  return app;
}
