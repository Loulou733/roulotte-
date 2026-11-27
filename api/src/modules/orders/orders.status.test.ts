//tests de la machine à états des commandes  fonction pure donc pas besoin de faux repository
import { describe, expect, it } from "vitest";
import { canMove } from "./orders.status.js";
describe("machine à états des commandes", () => {
  it("autorise le chemin normal RECEIVED > PREPARING > READY > PICKED_UP", () => {
    expect(canMove("RECEIVED", "PREPARING")).toBe(true);
    expect(canMove("PREPARING", "READY")).toBe(true);
    expect(canMove("READY", "PICKED_UP")).toBe(true);
  });
  it("autorise l'annulation tant que la commande est pas retirée", () => {
    expect(canMove("RECEIVED", "CANCELLED")).toBe(true);
    expect(canMove("PREPARING", "CANCELLED")).toBe(true);
    expect(canMove("READY", "CANCELLED")).toBe(true);
  });
  it("interdit de sauter une étape, de rester sur place ou de revenir en arrière", () => {
    expect(canMove("RECEIVED", "READY")).toBe(false);
    expect(canMove("RECEIVED", "RECEIVED")).toBe(false);
    expect(canMove("READY", "PREPARING")).toBe(false);
  });
  it("interdit toute transition depuis PICKED_UP et CANCELLED", () => {
    expect(canMove("PICKED_UP", "CANCELLED")).toBe(false);
    expect(canMove("CANCELLED", "RECEIVED")).toBe(false);
  });
});
