// Les adresses (URL) de la carte, et quelle méthode du controller répond à chacune.
import { Router } from "express";
import type { MenuController } from "./controller.js";

export function createMenuRouter(controller: MenuController) {
  const router = Router();

  router.get("/categories", (req, res) => controller.getCategories(req, res));
  router.get("/allergens", (req, res) => controller.getAllergens(req, res));
  router.get("/dishes", (req, res) => controller.getDishes(req, res));
  router.get("/dishes/:id", (req, res) => controller.getDish(req, res));

  return router;
}
