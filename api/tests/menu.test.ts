// Tests de la carte.
// Supertest envoie de fausses requêtes HTTP à l'app, SANS démarrer de vrai serveur.
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { container } from "../src/container.js";
import { MenuController } from "../src/modules/menu/controller.js";
import { InMemoryMenuRepository } from "../src/modules/menu/repository.js";
import { MenuService } from "../src/modules/menu/service.js";

// La carte en mémoire pour les tests : comme ça, on touche pas à la base de dev
const menuController = new MenuController(new MenuService(new InMemoryMenuRepository()));
const app = createApp({ ...container, menuController: menuController });

describe("La carte", () => {
  it("GET /categories renvoie les 5 catégories triées par position", async () => {
    const res = await request(app).get("/categories");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
    expect(res.body[0].name).toBe("Burgers");
    expect(res.body[4].name).toBe("Boissons");
  });

  it("GET /dishes pagine : page 1 de 20 par défaut, page 2 de 5", async () => {
    const res = await request(app).get("/dishes");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
    expect(res.body.total).toBe(16);

    const res2 = await request(app).get("/dishes?pageSize=5&page=2");
    expect(res2.body.items.length).toBe(5);
    expect(res2.body.page).toBe(2);
  });

  it("GET /dishes?allergenFree=gluten,lait ne renvoie aucun plat avec gluten ou lait", async () => {
    const res = await request(app).get("/dishes?allergenFree=gluten,lait&pageSize=50");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const dish of res.body.items) {
      for (const allergen of dish.allergens) {
        expect(allergen.code).not.toBe("gluten");
        expect(allergen.code).not.toBe("lait");
      }
    }
  });

  it("GET /dishes/:id : 404 si le plat n'existe pas, 400 si l'id est invalide", async () => {
    const res404 = await request(app).get("/dishes/999999");
    expect(res404.status).toBe(404);
    expect(res404.body.error.code).toBe("NOT_FOUND");

    const res400 = await request(app).get("/dishes/abc");
    expect(res400.status).toBe(400);
    expect(res400.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("findByIds renvoie seulement les plats qui existent", async () => {
    const repository = new InMemoryMenuRepository();

    const dishes = await repository.findByIds([1, 2, 999]);

    expect(dishes.length).toBe(2); // le 999 n'existe pas
    expect(dishes[0]?.id).toBe(1);
    expect(dishes[1]?.id).toBe(2);
  });
});
