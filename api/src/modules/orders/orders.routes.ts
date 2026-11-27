//les routes des commandes  dans l'énoncé les 3 sont pour les connectés donc requireAuth sur tout le routeur
import { Router } from "express";
import type { Auth } from "../../fourni/auth/index.js";
import { createOrderController } from "./orders.controller.js";
import type { OrderService } from "./orders.service.js";
//le routeur sera branché sur /orders dans app.ts donc "/" ici = /orders
export function createOrderRouter(service: OrderService, auth: Auth) {
  const controller = createOrderController(service);
  const router = Router();
  //sans token valide=401 avant même d'arriver au controller
  router.use(auth.requireAuth);
  router.post("/", controller.place);
  router.get("/", controller.list);
  router.get("/:id", controller.getOne);
  //connecté suffit ici  qui a le droit de faire quoi se règle dans le service
  router.patch("/:id/status", controller.changeStatus);
  return router;
}