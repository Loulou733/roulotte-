// Le "rangement" de la carte : catégories, allergènes, plats.
// Pour l'instant : des tableaux en mémoire, remplis avec donnees/menu.json.
// Plus tard, ton binôme pourra faire une version Prisma avec les MÊMES méthodes.
import { readFileSync } from "node:fs";

// ---------- Les formes des objets ----------

export type Category = { id: number; name: string; position: number };

export type Allergen = { id: number; code: string; label: string };

// Un plat, déjà au format du contrat (c'est ce qu'on renvoie au client)
export type Dish = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  available: boolean;
  stock: number | null; // null = illimité
  imageUrl: string | null;
  category: { id: number; name: string };
  allergens: { code: string; label: string }[];
};

// ---------- Ce que tout repository de la carte doit savoir faire ----------

export interface MenuRepository {
  findCategories(): Promise<Category[]>;
  findAllergens(): Promise<Allergen[]>;
  findDishes(): Promise<Dish[]>;
  findDishById(id: number): Promise<Dish | null>;
  findByIds(ids: number[]): Promise<Dish[]>; // pour les commandes (binôme)
}

// ---------- Ce que l'administratrice peut faire sur la carte (palier 2) ----------

// Un plat à créer (les valeurs par défaut sont déjà appliquées par le service)
export type NewDish = {
  name: string;
  description: string;
  priceCents: number;
  categoryId: number;
  allergens: string[]; // des codes : ["gluten", "lait"]
  available: boolean;
  stock: number | null;
};

// Les modifications d'un plat : tous les champs sont facultatifs
export type DishChanges = Partial<NewDish>;

export interface DishAdminRepository {
  create(data: NewDish): Promise<Dish>;
  update(id: number, changes: DishChanges): Promise<Dish | null>; // null = plat introuvable
  delete(id: number): Promise<boolean>; // false = plat introuvable
}

// ---------- La version "en mémoire" ----------

export class InMemoryMenuRepository implements MenuRepository {
  categories: Category[] = [];
  allergens: Allergen[] = [];
  dishes: Dish[] = [];

  constructor() {
    // Lire le fichier et le transformer en objet JavaScript
    const data = JSON.parse(readFileSync("donnees/menu.json", "utf8"));

    // 1. Les catégories (on leur donne un id : 1, 2, 3...)
    for (const c of data.categories) {
      this.categories.push({
        id: this.categories.length + 1,
        name: c.name,
        position: c.position,
      });
    }

    // 2. Les allergènes
    for (const a of data.allergens) {
      this.allergens.push({
        id: this.allergens.length + 1,
        code: a.code,
        label: a.label,
      });
    }

    // 3. Les plats. Dans le fichier, la catégorie est un NOM ("Burgers")
    //    et les allergènes sont des CODES ("gluten"). On va chercher les vrais objets.
    for (const d of data.dishes) {
      const category = this.findCategoryByName(d.category);
      if (category === null) {
        throw new Error("Catégorie inconnue dans menu.json : " + d.category);
      }

      const allergens = [];
      for (const code of d.allergens) {
        const allergen = this.findAllergenByCode(code);
        if (allergen !== null) {
          allergens.push({ code: allergen.code, label: allergen.label });
        }
      }

      this.dishes.push({
        id: this.dishes.length + 1,
        name: d.name,
        description: d.description,
        priceCents: d.priceCents,
        available: d.available,
        stock: d.stock,
        imageUrl: null,
        category: { id: category.id, name: category.name },
        allergens: allergens,
      });
    }
  }

  // Petites aides pour le constructeur
  findCategoryByName(name: string) {
    for (const category of this.categories) {
      if (category.name === name) {
        return category;
      }
    }
    return null;
  }

  findAllergenByCode(code: string) {
    for (const allergen of this.allergens) {
      if (allergen.code === code) {
        return allergen;
      }
    }
    return null;
  }

  // ---------- Les méthodes de l'interface ----------

  async findCategories() {
    return this.categories;
  }

  async findAllergens() {
    return this.allergens;
  }

  async findDishes() {
    return this.dishes;
  }

  async findDishById(id: number) {
    for (const dish of this.dishes) {
      if (dish.id === id) {
        return dish;
      }
    }
    return null; // pas trouvé
  }

  // Renvoie les plats dont l'id est dans la liste.
  // Les ids qui n'existent pas sont simplement absents du résultat.
  async findByIds(ids: number[]) {
    const result = [];
    for (const dish of this.dishes) {
      if (ids.includes(dish.id)) {
        result.push(dish);
      }
    }
    return result;
  }
}
