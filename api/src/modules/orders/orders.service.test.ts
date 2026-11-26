//tests unitaires du service des commandes avec de faux repositories donc pas besoin de base ni d'api qui tourne
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../fourni/auth/index.js";
import type { ListOrdersQuery, Order } from "./orders.dto.js";
import type { DishForOrder, NewOrder, OrderRepository } from "./orders.repository.js";
import { OrderService } from "./orders.service.js";
const client: AuthUser = { id: 1, role: "CUSTOMER" };
const autreClient: AuthUser = { id: 2, role: "CUSTOMER" };
const cuisine: AuthUser = { id: 3, role: "STAFF" };
function plat(id: number, priceCents: number, available = true): DishForOrder {
  return { id: id, priceCents: priceCents, available: available };
}
//une commande comme la base la renverrait
function commande(id: number, customerId: number): Order {
  return { id: id, status: "RECEIVED", note: null, totalCents: 0, createdAt: new Date(), updatedAt: new Date(), customer: { id: customerId, name: "Test" }, items: [] };
}
//faux repository qui respecte l'interface  vi.fn retient avec quoi chaque méthode a été appelée
//findById renvoie toujours une commande du client 1
function fauxOrders(): OrderRepository {
  return {
    create: vi.fn(async (data: NewOrder) => commande(1, data.customerId)),
    findById: vi.fn(async (id: number) => commande(id, 1)),
    list: vi.fn(async () => ({ items: [], total: 0 })),
  };
}
describe("OrderService", () => {
  //l'exemple de l'énoncé
  it("prend les prix dans la base, pas chez le client", async () => {
    const dishes = { findByIds: async () => [plat(1, 1000), plat(2, 250)] };
    const orders = fauxOrders();
    const service = new OrderService(orders, dishes);
    await service.place(client, { items: [{ dishId: 1, quantity: 2 }] });
    expect(orders.create).toHaveBeenCalledWith(expect.objectContaining({ totalCents: 2000 }));
  });
  it("refuse avec 422 en listant tous les plats refusés et crée rien", async () => {
    const dishes = { findByIds: async () => [plat(1, 1000), plat(2, 250, false)] };
    const orders = fauxOrders();
    const service = new OrderService(orders, dishes);
    const resultat = service.place(client, { items: [{ dishId: 1, quantity: 1 }, { dishId: 2, quantity: 1 }, { dishId: 99, quantity: 1 }] });
    await expect(resultat).rejects.toMatchObject({
      status: 422,
      code: "DISH_UNAVAILABLE",
      details: [{ dishId: 2, reason: "UNAVAILABLE" }, { dishId: 99, reason: "NOT_FOUND" }],
    });
    expect(orders.create).not.toHaveBeenCalled();
  });
  it("renvoie 404 quand un client lit la commande d'un autre client", async () => {
    const service = new OrderService(fauxOrders(), { findByIds: async () => [] });
    await expect(service.getFor(autreClient, 5)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
  it("laisse la cuisine lire la commande d'un client", async () => {
    const service = new OrderService(fauxOrders(), { findByIds: async () => [] });
    const order = await service.getFor(cuisine, 5);
    expect(order.id).toBe(5);
  });
  it("liste seulement les commandes du client mais toutes pour la cuisine", async () => {
    const orders = fauxOrders();
    const service = new OrderService(orders, { findByIds: async () => [] });
    const query: ListOrdersQuery = { sort: "-createdAt", page: 1, pageSize: 20 };
    await service.list(client, query);
    expect(orders.list).toHaveBeenLastCalledWith(1, query);
    await service.list(cuisine, query);
    expect(orders.list).toHaveBeenLastCalledWith(undefined, query);
  });
});