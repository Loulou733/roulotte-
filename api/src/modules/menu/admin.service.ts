// Les règles de l'administration de la carte : valeurs par défaut,
// catégorie et allergènes qui doivent exister, plat introuvable.
import { AppError } from "../../shared/errors.js";
import type { DishInput, DishUpdate } from "./admin.dto.js";
import type { DishAdminRepository, MenuRepository } from "./repository.js";

export class DishAdminService {
  dishes: DishAdminRepository;
  menu: MenuRepository; // juste pour lire les catégories et les allergènes

  constructor(dishes: DishAdminRepository, menu: MenuRepository) {
    this.dishes = dishes;
    this.menu = menu;
  }

  // POST /dishes
  async create(input: DishInput) {
    await this.checkReferences(input.categoryId, input.allergens);
    return this.dishes.create({
      name: input.name,
      description: input.description ?? "",
      priceCents: input.priceCents,
      categoryId: input.categoryId,
      allergens: input.allergens ?? [],
      available: input.available ?? true,
      stock: input.stock ?? null,
    });
  }

  // PATCH /dishes/:id
  async update(id: number, changes: DishUpdate) {
    await this.checkReferences(changes.categoryId, changes.allergens);
    const dish = await this.dishes.update(id, changes);
    if (dish === null) {
      throw new AppError(404, "NOT_FOUND", "Plat introuvable");
    }
    return dish;
  }

  // DELETE /dishes/:id
  async remove(id: number) {
    const found = await this.dishes.delete(id);
    if (!found) {
      throw new AppError(404, "NOT_FOUND", "Plat introuvable");
    }
  }

  // La catégorie et les allergènes donnés doivent exister, sinon 422
  async checkReferences(categoryId: number | undefined, allergenCodes: string[] | undefined) {
    if (categoryId !== undefined) {
      const categories = await this.menu.findCategories();
      let found = false;
      for (const category of categories) {
        if (category.id === categoryId) {
          found = true;
        }
      }
      if (!found) {
        throw new AppError(422, "INVALID_REFERENCE", "Catégorie inconnue", [{ field: "categoryId", value: categoryId }]);
      }
    }

    if (allergenCodes !== undefined) {
      const allergens = await this.menu.findAllergens();
      for (const code of allergenCodes) {
        let found = false;
        for (const allergen of allergens) {
          if (allergen.code === code) {
            found = true;
          }
        }
        if (!found) {
          throw new AppError(422, "INVALID_REFERENCE", "Allergène inconnu", [{ field: "allergens", value: code }]);
        }
      }
    }
  }
}
