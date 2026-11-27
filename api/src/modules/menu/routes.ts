// Les adresses (URL) de la carte, et quelle méthode du controller répond à chacune.
import { Router } from "express";
import type { Auth } from "../../fourni/auth/index.js";
import type { DishAdminController } from "./admin.controller.js";
import type { MenuController } from "./controller.js";

export function createMenuRouter(controller: MenuController, admin: DishAdminController, auth: Auth) {
  const router = Router();

  // Publiques : tout le monde peut lire la carte
  router.get("/categories", (req, res) => controller.getCategories(req, res));
  router.get("/allergens", (req, res) => controller.getAllergens(req, res));
  router.get("/dishes", (req, res) => controller.getDishes(req, res));
  router.get("/dishes/:id", (req, res) => controller.getDish(req, res));

  // Réservées à l'admin : requireAuth répond 401 sans token, puis requireRole répond 403 si ce n'est pas un ADMIN
  // (requireRole se place TOUJOURS après requireAuth)
  router.post("/dishes", auth.requireAuth, auth.requireRole("ADMIN"), (req, res) => admin.create(req, res));
  router.patch("/dishes/:id", auth.requireAuth, auth.requireRole("ADMIN"), (req, res) => admin.update(req, res));
  router.delete("/dishes/:id", auth.requireAuth, auth.requireRole("ADMIN"), (req, res) => admin.remove(req, res));

  return router;
}
