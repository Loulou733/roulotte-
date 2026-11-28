// Fabrique l'application Express (SANS la démarrer).
// Séparée de server.ts pour que les tests puissent l'utiliser.
import express from "express";
import type { Container } from "./container.js";
import { authErrorHandler, installSecurity } from "./fourni/auth/index.js";
import { createEventsRouter } from "./modules/events/events.routes.js";
import { createImageRouter } from "./modules/menu/image.routes.js";
import { createMenuRouter } from "./modules/menu/routes.js";
import { createOrderRouter } from "./modules/orders/orders.routes.js";
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
  // Les photos, servies telles quelles. "cross-origin" sinon Helmet empêche le front (autre port) de les afficher
  app.use("/uploads", express.static("uploads", {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }));
  app.use(createMenuRouter(container.menuController, container.dishAdminController, container.auth)); // /categories, /allergens, /dishes

  app.use(createImageRouter(container.dishImageService, container.auth)); // PUT /dishes/:id/image (admin)
  app.use("/orders", createOrderRouter(container.orderService, container.auth)); // connectés seulement
  app.use(createEventsRouter(container.events, container.auth)); // GET /events, le flux en direct (connectés)

  // 3. Aucune route n'a répondu -> 404
  app.use(notFound);

  // 4. Les gestionnaires d'erreurs : TOUJOURS à la fin
  app.use(authErrorHandler); // les erreurs du module d'auth
  app.use(errorHandler); // toutes les autres

  return app;
}
