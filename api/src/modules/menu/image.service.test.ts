//tests de l'upload des photos  faux repositories et faux stockage donc rien écrit sur le disque
import { describe, expect, it, vi } from "vitest";
import type { ImageStorage } from "./image-storage.js";
import { DishImageService } from "./image.service.js";
import type { Dish, DishImageRepository, MenuRepository } from "./repository.js";
//un vrai PNG de 1 pixel sur 1
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
function plat(imageUrl: string | null): Dish {
  return { id: 1, name: "Burger", description: "", priceCents: 900, available: true, stock: null, imageUrl: imageUrl, category: { id: 1, name: "Burgers" }, allergens: [] };
}
//la carte connaît juste le plat 1
function carte(imageUrl: string | null) {
  return { findDishById: async (id: number) => (id === 1 ? plat(imageUrl) : null) } as unknown as MenuRepository;
}
function fauxPlats(): DishImageRepository {
  return { setImage: vi.fn(async (id: number, imageUrl: string) => plat(imageUrl)) };
}
function fauxStockage(): ImageStorage {
  return {
    save: vi.fn(async (fileName: string) => "/uploads/dishes/" + fileName),
    remove: vi.fn(async () => {}),
  };
}
describe("DishImageService", () => {
  it("range un vrai PNG sous un nom choisi par le serveur", async () => {
    const dishes = fauxPlats();
    const images = fauxStockage();
    const dish = await new DishImageService(carte(null), dishes, images).setImage(1, PNG);
    expect(images.save).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f-]{36}\.png$/), PNG);
    expect(dish.imageUrl).toMatch(/^\/uploads\/dishes\/.+\.png$/);
    expect(dishes.setImage).toHaveBeenCalledWith(1, dish.imageUrl);
  });
  it("refuse un faux PNG avec 415 et range rien", async () => {
    const images = fauxStockage();
    const resultat = new DishImageService(carte(null), fauxPlats(), images).setImage(1, Buffer.from("je ne suis pas une image"));
    await expect(resultat).rejects.toMatchObject({ status: 415, code: "UNSUPPORTED_MEDIA_TYPE" });
    expect(images.save).not.toHaveBeenCalled();
  });
  it("renvoie 404 pour un plat qui existe pas", async () => {
    const resultat = new DishImageService(carte(null), fauxPlats(), fauxStockage()).setImage(99, PNG);
    await expect(resultat).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
  it("supprime l'ancienne photo quand on en met une nouvelle", async () => {
    const images = fauxStockage();
    await new DishImageService(carte("/uploads/dishes/ancienne.png"), fauxPlats(), images).setImage(1, PNG);
    expect(images.remove).toHaveBeenCalledWith("/uploads/dishes/ancienne.png");
  });
});
