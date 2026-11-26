//reçoit les requêtes HTTP des commandes  valide avec le DTO appelle le service répond
import type { Request, Response } from "express";
import { z } from "zod";
import { listOrdersQuerySchema, placeOrderSchema, toOrderDto } from "./orders.dto.js";
import type { OrderService } from "./orders.service.js";
//l'id de l'URL arrive en texte donc on le transforme en nombre entier sinon 400
const idSchema = z.coerce.number().int().min(1);
//le "!" après req.user  requireAuth est passé avant donc l'utilisateur est forcément là
export function createOrderController(service: OrderService) {
  //POST /orders=201  l'adresse de la nouvelle commande dans l'en-tête Location
  async function place(req: Request, res: Response) {
    const input = placeOrderSchema.parse(req.body);
    const order = await service.place(req.user!, input);
    res.status(201).location(`/orders/${order.id}`).json(toOrderDto(order));
  }
  //GET /orders
  async function list(req: Request, res: Response) {
    const query = listOrdersQuerySchema.parse(req.query);
    const result = await service.list(req.user!, query);
    const items = [];
    for (const order of result.items) {
      items.push(toOrderDto(order));
    }
    res.json({ items: items, total: result.total, page: query.page, pageSize: query.pageSize });
  }
  //GET /orders/:id
  async function getOne(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    const order = await service.getFor(req.user!, id);
    res.json(toOrderDto(order));
  }
  return { place, list, getOne };
}