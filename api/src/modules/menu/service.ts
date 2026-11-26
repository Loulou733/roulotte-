// Le "chef" de la carte : il demande les données au repository
// puis applique les règles (tri, filtres, pagination, 404).
// Il ne connaît PAS le HTTP : pas de req, pas de res.
import { AppError } from "../../shared/errors.js";
import type { Category, Dish, MenuRepository } from "./repository.js";

// Les filtres de GET /dishes (déjà vérifiés par Zod dans le controller)
export type DishFilters = {
  category?: number;
  available?: "true" | "false";
  allergenFree?: string; // ex : "gluten,lait"
  q?: string;
  page: number;
  pageSize: number;
};

export class MenuService {
  repository: MenuRepository;

  constructor(repository: MenuRepository) {
    this.repository = repository;
  }

  // GET /categories : triées par position
  async getCategories() {
    const categories = await this.repository.findCategories();
    categories.sort((a, b) => a.position - b.position);
    return categories;
  }

  // GET /allergens : triés par code (ordre alphabétique)
  async getAllergens() {
    const allergens = await this.repository.findAllergens();
    allergens.sort((a, b) => a.code.localeCompare(b.code));
    return allergens;
  }

  // GET /dishes : filtrer, trier, puis découper en pages
  async getDishes(filters: DishFilters) {
    const allDishes = await this.repository.findDishes();
    const categories = await this.repository.findCategories();

    // 1. Filtrer : on garde seulement les plats qui passent tous les filtres
    const dishes: Dish[] = [];
    for (const dish of allDishes) {
      if (keepDish(dish, filters)) {
        dishes.push(dish);
      }
    }

    // 2. Trier : d'abord par position de la catégorie, puis par nom
    dishes.sort((a, b) => {
      const positionA = positionOf(categories, a.category.id);
      const positionB = positionOf(categories, b.category.id);
      if (positionA !== positionB) {
        return positionA - positionB;
      }
      return a.name.localeCompare(b.name, "fr");
    });

    // 3. Paginer : ex. page 2 avec pageSize 5 -> plats n°5 à 9
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;

    return {
      items: dishes.slice(start, end),
      total: dishes.length, // nombre de plats sur TOUTES les pages
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  // GET /dishes/:id : le plat, ou une erreur 404
  async getDish(id: number) {
    const dish = await this.repository.findDishById(id);
    if (dish === null) {
      throw new AppError(404, "NOT_FOUND", "Plat introuvable");
    }
    return dish;
  }
}

// Est-ce que ce plat passe les filtres ? (true = on le garde)
function keepDish(dish: Dish, filters: DishFilters) {
  // ?category=5 : seulement cette catégorie
  if (filters.category !== undefined && dish.category.id !== filters.category) {
    return false;
  }

  // ?available=true ou ?available=false
  if (filters.available === "true" && dish.available === false) {
    return false;
  }
  if (filters.available === "false" && dish.available === true) {
    return false;
  }

  // ?q=frites : le nom contient "frites" (majuscules ou minuscules, peu importe)
  if (filters.q !== undefined) {
    const name = dish.name.toLowerCase();
    const search = filters.q.toLowerCase();
    if (!name.includes(search)) {
      return false;
    }
  }

  // ?allergenFree=gluten,lait : le plat ne doit contenir AUCUN de ces allergènes
  if (filters.allergenFree !== undefined) {
    const forbidden = filters.allergenFree.split(","); // ["gluten", "lait"]
    for (const allergen of dish.allergens) {
      if (forbidden.includes(allergen.code)) {
        return false;
      }
    }
  }

  return true;
}

// Trouve la position d'une catégorie à partir de son id
function positionOf(categories: Category[], categoryId: number) {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category.position;
    }
  }
  return 0;
}
