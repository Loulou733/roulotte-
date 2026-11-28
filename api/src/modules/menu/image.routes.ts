//la route des photos  réservée à l'admin  requireRole passe avant multer donc un non-admin envoie rien
import { Router } from "express";
import type { Auth } from "../../fourni/auth/index.js";
import { createImageController, receiveImage } from "./image.controller.js";
import type { DishImageService } from "./image.service.js";
export function createImageRouter(service: DishImageService, auth: Auth) {
  const controller = createImageController(service);
  const router = Router();
  router.put("/dishes/:id/image", auth.requireAuth, auth.requireRole("ADMIN"), receiveImage, controller.upload);
  return router;
}
