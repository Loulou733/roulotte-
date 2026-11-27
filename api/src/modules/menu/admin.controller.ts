// Le guichet de l'administration de la carte : lit la requête, vérifie avec Zod,
// appelle le service, répond.
import type { Request, Response } from "express";
import { z } from "zod";
import { dishInputSchema, dishUpdateSchema } from "./admin.dto.js";
import type { DishAdminService } from "./admin.service.js";

const idSchema = z.coerce.number().int().min(1);

export class DishAdminController {
  service: DishAdminService;

  constructor(service: DishAdminService) {
    this.service = service;
  }

  // 201 + l'adresse du nouveau plat dans l'en-tête Location
  async create(req: Request, res: Response) {
    const input = dishInputSchema.parse(req.body);
    const dish = await this.service.create(input);
    res.status(201).location("/dishes/" + dish.id).json(dish);
  }

  async update(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    const changes = dishUpdateSchema.parse(req.body);
    const dish = await this.service.update(id, changes);
    res.json(dish);
  }

  // 204 = réussi, rien à renvoyer
  async remove(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    await this.service.remove(id);
    res.status(204).send();
  }
}
