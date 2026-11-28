//tests du bus  le service annonce order.created et order.updated  pas besoin de SSE pour vérifier
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../fourni/auth/index.js";
import type { Order } from "./orders.dto.js";
import type { NewOrder, OrderRepository } from "./orders.repository.js";
import { OrderService } from "./orders.service.js";
const client: AuthUser = { id: 1, role: "CUSTOMER" };
const cuisine: AuthUser = { id: 3, role: "STAFF" };
function commande(id: number, status: string): Order {
  return { id: id, status: status, note: null, totalCents: 0, createdAt: new Date(), updatedAt: new Date(), customer: { id: 1, name: "Test" }, items: [] };
}
function fauxOrders(): OrderRepository {
  return {
    create: vi.fn(async (data: NewOrder) => commande(7, "RECEIVED")),
    findById: vi.fn(async (id: number) => commande(id, "RECEIVED")),
    changeStatus: vi.fn(async (id: number, from: string, to: string) => commande(id, to)),
    list: vi.fn(),
  };
}
const dishes = { findByIds: async () => [{ id: 1, priceCents: 500, available: true }] };
describe("OrderService et le bus", () => {
  it("annonce order.created avec la commande quand elle est passée", async () => {
    const events = new EventEmitter();
    const recu = vi.fn();
    events.on("order.created", recu);
    await new OrderService(fauxOrders(), dishes, events).place(client, { items: [{ dishId: 1, quantity: 1 }] });
    expect(recu).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "RECEIVED" }));
  });
  it("annonce order.updated avec le nouveau statut", async () => {
    const events = new EventEmitter();
    const recu = vi.fn();
    events.on("order.updated", recu);
    await new OrderService(fauxOrders(), dishes, events).changeStatus(cuisine, 7, "PREPARING");
    expect(recu).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "PREPARING" }));
  });
});
