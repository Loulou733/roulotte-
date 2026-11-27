//la logique des commandes  prix pris dans la base plats refusés qui a le droit de voir quoi
//pas de req/res ni de prisma le service passe juste par les repositories
import type { AuthUser } from "../../fourni/auth/index.js";
import { AppError } from "../../shared/errors.js";
import { canMove } from "./orders.status.js";
import type { ListOrdersQuery, PlaceOrderInput } from "./orders.dto.js";
import type { DishReader, NewOrder, OrderRepository } from "./orders.repository.js";
export class OrderService {
  orders: OrderRepository;
  dishes: DishReader;
  constructor(orders: OrderRepository, dishes: DishReader) {
    this.orders = orders;
    this.dishes = dishes;
  }
  //POST /orders
  async place(user: AuthUser, input: PlaceOrderInput) {
    const ids = [];
    for (const item of input.items) {
      ids.push(item.dishId);
    }
    const dishes = await this.dishes.findByIds(ids);
    const refused = [];
    const lines: NewOrder["items"] = [];
    let totalCents = 0;
    for (const item of input.items) {
      const dish = dishes.find((d) => d.id === item.dishId);
      if (!dish) {
        refused.push({ dishId: item.dishId, reason: "NOT_FOUND" });
      } else if (!dish.available) {
        refused.push({ dishId: item.dishId, reason: "UNAVAILABLE" });
      } else {
        //le prix vient de la base, jamais de ce que le client envoie
        lines.push({ dishId: dish.id, quantity: item.quantity, unitPriceCents: dish.priceCents });
        totalCents = totalCents + item.quantity * dish.priceCents;
      }
    }
    //on renvoie tous les plats refusés d'un coup pas que le prmeier 
    if (refused.length > 0) {
      throw new AppError(422, "DISH_UNAVAILABLE", "Plat inexistant ou indisponible", refused);
    }
    return this.orders.create({
      customerId: user.id,
      note: input.note ?? null,
      totalCents: totalCents,
      items: lines,
    });
  }
  //GET /orders  un client voit que ses commandes la cuisine et l'admin voient tout
  list(user: AuthUser, query: ListOrdersQuery) {
    if (user.role === "CUSTOMER") {
      return this.orders.list(user.id, query);
    }
    return this.orders.list(undefined, query);
  }
  //GET /orders/:id  la commande d'un autre client=404 on dit même pas qu'elle existe
  async getFor(user: AuthUser, id: number) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Commande introuvable");
    }
    if (user.role === "CUSTOMER" && order.customer.id !== user.id) {
      throw new AppError(404, "NOT_FOUND", "Commande introuvable");
    }
    return order;
  }
  //PATCH /orders/:id/status  cuisine et admin font avancer ou annulent  un client peut seulement annuler SA commande
  async changeStatus(user: AuthUser, id: number, status: string) {
    //getFor renvoie déjà 404 pour la commande d'un autre client
    const order = await this.getFor(user, id);
    if (user.role === "CUSTOMER" && status !== "CANCELLED") {
      throw new AppError(403, "FORBIDDEN", "Un client peut seulement annuler sa commande");
    }
    //un client annule seulement tant que la cuisine n'a pas commencé  après c'est 409 même si la cuisine, elle, pourrait annuler
    if (user.role === "CUSTOMER" && order.status !== "RECEIVED") {
      throw new AppError(409, "INVALID_TRANSITION", "Trop tard : la commande est déjà en préparation");
    }
    if (!canMove(order.status, status)) {
      throw new AppError(409, "INVALID_TRANSITION", "Passage de " + order.status + " à " + status + " interdit");
    }
    //annuler = remettre les portions en stock
    return this.orders.changeStatus(id, order.status, status, status === "CANCELLED");
  }
}
