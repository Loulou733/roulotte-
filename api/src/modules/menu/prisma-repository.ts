//la version prisma du rangement de la carte  mêmes méthodes que la version en mémoire donc le service change pas
import { prisma } from "../../db/prisma.js";
import type { Dish, MenuRepository } from "./repository.js";
//ce qu'on ramène avec chaque plat  sa catégorie et ses allergènes
const withRelations = {
  category: { select: { id: true, name: true } },
  allergens: { select: { code: true, label: true } },
};
//met un plat de la base à la forme du contrat  stock et imageUrl arrivent aux paliers 2 et 3 donc null pour l'instant
function toDish(dish: Omit<Dish, "stock" | "imageUrl">): Dish {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    priceCents: dish.priceCents,
    available: dish.available,
    stock: null,
    imageUrl: null,
    category: { id: dish.category.id, name: dish.category.name },
    allergens: dish.allergens,
  };
}
export class PrismaMenuRepository implements MenuRepository {
  async findCategories() {
    return prisma.category.findMany();
  }
  async findAllergens() {
    return prisma.allergen.findMany();
  }
  async findDishes() {
    const dishes = await prisma.dish.findMany({ include: withRelations });
    const result = [];
    for (const dish of dishes) {
      result.push(toDish(dish));
    }
    return result;
  }
  async findDishById(id: number) {
    const dish = await prisma.dish.findUnique({ where: { id: id }, include: withRelations });
    if (dish === null) {
      return null;
    }
    return toDish(dish);
  }
  //pour les commandes  un id qui existe pas est juste absent du résultat
  async findByIds(ids: number[]) {
    const dishes = await prisma.dish.findMany({ where: { id: { in: ids } }, include: withRelations });
    const result = [];
    for (const dish of dishes) {
      result.push(toDish(dish));
    }
    return result;
  }
}
