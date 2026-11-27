//tests du changement de statut dans le service  faux repository donc pas de base
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../fourni/auth/index.js";
import type { Order } from "./orders.dto.js";
import type { OrderRepository } from "./orders.repository.js";
import { OrderService } from "./orders.service.js";
const client: AuthUser = { id: 1, role: "CUSTOMER" };
const autreClient: AuthUser = { id: 2, role: "CUSTOMER" };
const cuisine: AuthUser = { id: 3, role: "STAFF" };
//une commande du client 1 avec le statut voulu
function commande(status: string): Order {
  return { id: 5, status: status, note: null, totalCents: 0, createdAt: new Date(), updatedAt: new Date(), customer: { id: 1, name: "Test" }, items: [] };
}
function fauxOrders(status: string): OrderRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(async () => commande(status)),
    changeStatus: vi.fn(async (id: number, from: string, to: string) => commande(to)),
    list: vi.fn(),
  };
}
describe("OrderService.changeStatus", () => {
  it("la cuisine fait avancer une commande sans remettre de stock", async () => {
    const orders = fauxOrders("RECEIVED");
    await new OrderService(orders, { findByIds: async () => [] }).changeStatus(cuisine, 5, "PREPARING");
    expect(orders.changeStatus).toHaveBeenCalledWith(5, "RECEIVED", "PREPARING", false);
  });
  it("une annulation demande de remettre les portions en stock", async () => {
    const orders = fauxOrders("RECEIVED");
    await new OrderService(orders, { findByIds: async () => [] }).changeStatus(client, 5, "CANCELLED");
    expect(orders.changeStatus).toHaveBeenCalledWith(5, "RECEIVED", "CANCELLED", true);
  });
  it("refuse avec 409 une transition interdite", async () => {
    const orders = fauxOrders("RECEIVED");
    const resultat = new OrderService(orders, { findByIds: async () => [] }).changeStatus(cuisine, 5, "READY");
    await expect(resultat).rejects.toMatchObject({ status: 409, code: "INVALID_TRANSITION" });
    expect(orders.changeStatus).not.toHaveBeenCalled();
  });
  it("un client qui demande autre chose que CANCELLED prend une 403", async () => {
    const orders = fauxOrders("RECEIVED");
    const resultat = new OrderService(orders, { findByIds: async () => [] }).changeStatus(client, 5, "PREPARING");
    await expect(resultat).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
  it("un client ne peut plus annuler une commande déjà en préparation (409)", async () => {
    const orders = fauxOrders("PREPARING");
    const resultat = new OrderService(orders, { findByIds: async () => [] }).changeStatus(client, 5, "CANCELLED");
    await expect(resultat).rejects.toMatchObject({ status: 409, code: "INVALID_TRANSITION" });
  });
  it("un client qui annule la commande d'un autre prend une 404", async () => {
    const orders = fauxOrders("RECEIVED");
    const resultat = new OrderService(orders, { findByIds: async () => [] }).changeStatus(autreClient, 5, "CANCELLED");
    await expect(resultat).rejects.toMatchObject({ status: 404 });
  });
});
