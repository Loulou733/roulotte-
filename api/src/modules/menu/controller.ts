// Le "guichet" de la carte : il lit la requête HTTP (req),
// vérifie les données avec Zod, appelle le service, puis répond (res).
import type { Request, Response } from "express";
import { z } from "zod";
import type { MenuService } from "./service.js";

// /dishes/:id -> l'id doit être un entier >= 1 (sinon 400 VALIDATION_ERROR)
const paramsSchema = z.object({
  id: z.coerce.number().int().min(1),
});

// Les paramètres de GET /dishes?...
// Tout arrive en TEXTE dans l'URL : z.coerce.number() transforme "2" en 2.
const dishesQuerySchema = z.object({
  category: z.coerce.number().int().min(1).optional(),
  available: z.enum(["true", "false"]).optional(),
  allergenFree: z.string().optional(),
  q: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export class MenuController {
  service: MenuService;

  constructor(service: MenuService) {
    this.service = service;
  }

  async getCategories(req: Request, res: Response) {
    const categories = await this.service.getCategories();
    res.json(categories);
  }

  async getAllergens(req: Request, res: Response) {
    const allergens = await this.service.getAllergens();
    res.json(allergens);
  }

  async getDishes(req: Request, res: Response) {
    // Si un paramètre est faux, parse lance une ZodError -> errorHandler -> 400
    const filters = dishesQuerySchema.parse(req.query);
    const page = await this.service.getDishes(filters);
    res.json(page);
  }

  async getDish(req: Request, res: Response) {
    const params = paramsSchema.parse(req.params);
    const dish = await this.service.getDish(params.id);
    res.json(dish);
  }
}
