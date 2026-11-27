import {z} from "zod";
const STATUTS = ["RECEIVED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"] as const;
function hasDuplicates(items: { dishId: number }[]) {
  const seen: number[] = [];
  for (const item of items) {
    if (seen.includes(item.dishId)) {
      return true;
    }
    seen.push(item.dishId);
  }
  return false;
}
export const placeOrderSchema = z
    .strictObject({
        items: z
        .array(
            z.strictObject({
                dishId: z.number().int().min(1),
                quantity: z.number().int().min(1).max(10),
            }),
        )
        .min(1)
        .max(20),
    note: z.string().max(200).optional(),
    })
      .refine((body) => !hasDuplicates(body.items), {
        message: "un plat peut apparaître qu'une fois",
        path: ["items"],
      });
export const listOrdersQuerySchema = z.strictObject({
    status: z
        .string()
        .transform((text)=> text.split(","))
        .pipe(z.array(z.enum(STATUTS)))
        .optional(),
    sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
//PATCH /orders/:id/status  le corps contient juste le nouveau statut
export const changeStatusSchema = z.strictObject({ status: z.enum(STATUTS) });
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type Order = {
    id: number;
    status: string;
    note: string | null;
    totalCents: number;
    createdAt: Date;
    updatedAt: Date;
    customer: {id: number; name: string};
    items: { dishId: number; quantity: number; unitPriceCents: number; dish: { name: string } }[];
};
export function toOrderDto(order: Order) {
  const items = [];
  for (const item of order.items) {
    items.push({
      dishId: item.dishId,
      name: item.dish.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.quantity * item.unitPriceCents,
    });
  }
  return {
    id: order.id,
    status: order.status,
    note: order.note,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: { id: order.customer.id, name: order.customer.name },
    items: items,
  };
}