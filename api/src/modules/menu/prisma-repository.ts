// La carte dans la vraie base (Prisma). C'est le seul fichier de la carte qui parle à la base.
// Il fait les mêmes choses que la version en mémoire, plus l'administration des plats.
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../shared/errors.js";
import type { Dish, DishAdminRepository, DishChanges, DishImageRepository, MenuRepository, NewDish } from "./repository.js";

// Ce qu'on ramène avec chaque plat : sa catégorie (id + nom) et ses allergènes (code + libellé)
const withDetails = {
  category: { select: { id: true, name: true } },
  allergens: { select: { code: true, label: true } },
};

// Un plat tel que la base le renvoie
type DishRow = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  available: boolean;
  stock: number | null;
  imageUrl: string | null;
  category: { id: number; name: string };
  allergens: { code: string; label: string }[];
};

// On transforme la ligne de la base en plat du contrat
function toDish(row: DishRow): Dish {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    available: row.available,
    stock: row.stock,
    imageUrl: row.imageUrl,
    category: row.category,
    allergens: row.allergens,
  };
}

// ["gluten", "lait"] devient [{ code: "gluten" }, { code: "lait" }] : le format que Prisma attend
function toCodes(codes: string[]) {
  const result = [];
  for (const code of codes) {
    result.push({ code: code });
  }
  return result;
}

// Prisma donne un code d'erreur (P2002, P2003...) : on le lit ici
function prismaCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code: string }).code;
  }
  return "";
}

export class PrismaMenuRepository implements MenuRepository, DishAdminRepository, DishImageRepository {
  async findCategories() {
    return prisma.category.findMany();
  }

  async findAllergens() {
    return prisma.allergen.findMany();
  }

  async findDishes() {
    const rows = await prisma.dish.findMany({ include: withDetails });
    return rows.map(toDish);
  }

  async findDishById(id: number) {
    const row = await prisma.dish.findUnique({ where: { id: id }, include: withDetails });
    return row === null ? null : toDish(row);
  }

  async findByIds(ids: number[]) {
    const rows = await prisma.dish.findMany({ where: { id: { in: ids } }, include: withDetails });
    return rows.map(toDish);
  }

  async create(data: NewDish) {
    try {
      const row = await prisma.dish.create({
        data: {
          name: data.name,
          description: data.description,
          priceCents: data.priceCents,
          available: data.available,
          stock: data.stock,
          category: { connect: { id: data.categoryId } },
          allergens: { connect: toCodes(data.allergens) },
        },
        include: withDetails,
      });
      return toDish(row);
    } catch (error) {
      // P2002 = le nom existe déjà (il est unique)
      if (prismaCode(error) === "P2002") {
        throw new AppError(409, "CONFLICT", "Un plat porte déjà ce nom");
      }
      throw error;
    }
  }

  async update(id: number, changes: DishChanges) {
    try {
      const row = await prisma.dish.update({
        where: { id: id },
        data: {
          name: changes.name,
          description: changes.description,
          priceCents: changes.priceCents,
          available: changes.available,
          stock: changes.stock,
          // undefined = Prisma ne touche pas au champ
          category: changes.categoryId === undefined ? undefined : { connect: { id: changes.categoryId } },
          // "set" remplace toute la liste d'allergènes
          allergens: changes.allergens === undefined ? undefined : { set: toCodes(changes.allergens) },
        },
        include: withDetails,
      });
      return toDish(row);
    } catch (error) {
      const code = prismaCode(error);
      if (code === "P2025") {
        return null; // plat introuvable
      }
      if (code === "P2002") {
        throw new AppError(409, "CONFLICT", "Un plat porte déjà ce nom");
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      await prisma.dish.delete({ where: { id: id } });
      return true;
    } catch (error) {
      const code = prismaCode(error);
      if (code === "P2025") {
        return false; // plat introuvable
      }
      // P2003 = le plat est dans une commande (règle onDelete: Restrict)
      if (code === "P2003") {
        throw new AppError(409, "CONFLICT", "Plat déjà commandé : rends-le indisponible à la place");
      }
      throw error;
    }
  }

  //palier 3  range l'adresse de la nouvelle photo
  async setImage(id: number, imageUrl: string) {
    try {
      const row = await prisma.dish.update({ where: { id: id }, data: { imageUrl: imageUrl }, include: withDetails });
      return toDish(row);
    } catch (error) {
      if (prismaCode(error) === "P2025") {
        return null; // plat introuvable
      }
      throw error;
    }
  }
}
