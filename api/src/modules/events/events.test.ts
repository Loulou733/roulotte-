//tests de qui reçoit quoi dans le flux SSE
import { describe, expect, it } from "vitest";
import type { AuthUser } from "../../fourni/auth/index.js";
import type { Order } from "../orders/orders.dto.js";
import { canReceive } from "./events.routes.js";
const alice: AuthUser = { id: 1, role: "CUSTOMER" };
const bob: AuthUser = { id: 2, role: "CUSTOMER" };
const cuisine: AuthUser = { id: 3, role: "STAFF" };
const admin: AuthUser = { id: 4, role: "ADMIN" };
//une commande d'alice
const commande: Order = { id: 5, status: "RECEIVED", note: null, totalCents: 0, createdAt: new Date(), updatedAt: new Date(), customer: { id: 1, name: "Alice" }, items: [] };
describe("canReceive", () => {
  it("la cuisine et l'admin reçoivent order.created et order.updated", () => {
    expect(canReceive(cuisine, "order.created", commande)).toBe(true);
    expect(canReceive(cuisine, "order.updated", commande)).toBe(true);
    expect(canReceive(admin, "order.created", commande)).toBe(true);
  });
  it("un client reçoit seulement order.updated de SA commande", () => {
    expect(canReceive(alice, "order.updated", commande)).toBe(true);
    expect(canReceive(alice, "order.created", commande)).toBe(false);
    expect(canReceive(bob, "order.updated", commande)).toBe(false);
  });
});
