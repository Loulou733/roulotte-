// Les données que l'administratrice envoie pour créer ou modifier un plat.
// strictObject = un champ inconnu (ex : "promo") est refusé avec une 400.
import { z } from "zod";

export const dishInputSchema = z.strictObject({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  priceCents: z.number().int().min(50).max(10000),
  categoryId: z.number().int(),
  allergens: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  stock: z.number().int().min(0).nullable().optional(), // null = illimité
});

// Modification : les mêmes champs, tous facultatifs, mais au moins un
export const dishUpdateSchema = dishInputSchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: "Au moins un champ est attendu",
});

export type DishInput = z.infer<typeof dishInputSchema>;
export type DishUpdate = z.infer<typeof dishUpdateSchema>;
