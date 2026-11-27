//tests de l'administration de la carte avec de faux repositories
import { describe, expect, it, vi } from "vitest";
import { DishAdminService } from "./admin.service.js";
import type { DishAdminRepository, MenuRepository } from "./repository.js";
//une carte avec une seule catégorie (id 1) et un seul allergène (gluten)
const carte = {
  findCategories: async () => [{ id: 1, name: "Desserts", position: 1 }],
  findAllergens: async () => [{ id: 1, code: "gluten", label: "Gluten" }],
} as unknown as MenuRepository;
function fauxAdmin(): DishAdminRepository {
  return {
    create: vi.fn(async (data) => ({ id: 1, ...data }) as never),
    update: vi.fn(async () => null),
    delete: vi.fn(async () => false),
  };
}
describe("DishAdminService", () => {
  it("applique les valeurs par défaut à la création", async () => {
    const repo = fauxAdmin();
    await new DishAdminService(repo, carte).create({ name: "Tarte", priceCents: 450, categoryId: 1 });
    expect(repo.create).toHaveBeenCalledWith({ name: "Tarte", description: "", priceCents: 450, categoryId: 1, allergens: [], available: true, stock: null });
  });
  it("refuse une catégorie inconnue avec 422 et ne crée rien", async () => {
    const repo = fauxAdmin();
    const resultat = new DishAdminService(repo, carte).create({ name: "Tarte", priceCents: 450, categoryId: 99 });
    await expect(resultat).rejects.toMatchObject({ status: 422, code: "INVALID_REFERENCE" });
    expect(repo.create).not.toHaveBeenCalled();
  });
  it("refuse un allergène inconnu avec 422", async () => {
    const resultat = new DishAdminService(fauxAdmin(), carte).create({ name: "Tarte", priceCents: 450, categoryId: 1, allergens: ["kryptonite"] });
    await expect(resultat).rejects.toMatchObject({ status: 422, code: "INVALID_REFERENCE" });
  });
  it("répond 404 pour modifier ou supprimer un plat qui n'existe pas", async () => {
    const service = new DishAdminService(fauxAdmin(), carte);
    await expect(service.update(99, { priceCents: 600 })).rejects.toMatchObject({ status: 404 });
    await expect(service.remove(99)).rejects.toMatchObject({ status: 404 });
  });
});
