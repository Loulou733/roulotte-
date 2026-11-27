//la version prisma du repository des commandes c'est le seul fichier des commandes qui parle à la base
import { prisma } from "../../db/prisma.js";
import type { OrderStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../../shared/errors.js";
import type { ListOrdersQuery, Order } from "./orders.dto.js";
import type { NewOrder, OrderRepository } from "./orders.repository.js";
//ce qu'on ramène avec chaque commande  le client juste id et nom et le nom des plats
//écrit une seule fois et utilisé par les 3 méthodes
const details = {
  customer: { select: { id: true, name: true } },
  items: { include: { dish: { select: { name: true } } } },
};
export class PrismaOrderRepository implements OrderRepository {
  //une transaction = tout ou rien  si un plat manque on lance l'erreur et rien est gardé (ni stock retiré ni commande)
  async create(order: NewOrder): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      const missing = [];
      for (const item of order.items) {
        //on retire le stock seulement s'il y en a assez (stock null = illimité) et le tout en une seule requête
        //jamais "lire puis écrire" sinon deux clients pourraient prendre la dernière portion en même temps
        const result = await tx.dish.updateMany({
          where: { id: item.dishId, OR: [{ stock: null }, { stock: { gte: item.quantity } }] },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const dish = await tx.dish.findUnique({ where: { id: item.dishId } });
          missing.push({ dishId: item.dishId, available: dish?.stock ?? 0 });
        }
      }
      if (missing.length > 0) {
        throw new AppError(409, "OUT_OF_STOCK", "Stock insuffisant", missing);
      }
      //la commande et ses lignes sont créées d'un coup avec items create
      return tx.order.create({
        data: {
          customerId: order.customerId,
          note: order.note,
          totalCents: order.totalCents,
          items: { create: order.items },
        },
        include: details,
      });
    });
  }
  //change le statut et si besoin remet les portions en stock  le tout dans une transaction
  async changeStatus(id: number, from: string, to: string, restock: boolean): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      //on change seulement si le statut est toujours "from" sinon deux annulations en même temps remettraient le stock deux fois
      const result = await tx.order.updateMany({ where: { id: id, status: from as OrderStatus }, data: { status: to as OrderStatus } });
      if (result.count === 0) {
        throw new AppError(409, "INVALID_TRANSITION", "La commande a déjà changé de statut");
      }
      if (restock) {
        const lines = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const line of lines) {
          //stock null = illimité donc rien à remettre
          await tx.dish.updateMany({ where: { id: line.dishId, stock: { not: null } }, data: { stock: { increment: line.quantity } } });
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id: id }, include: details });
    });
  }
  //null si la commande existe pas  c'est le service qui renvoie le 404
  async findById(id: number): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id: id }, include: details });
  }
  //customerId ou status undefined = prisma ignore le filtre
  async list(customerId: number | undefined, query: ListOrdersQuery): Promise<{ items: Order[]; total: number }> {
    const where = {
      customerId: customerId,
      status: query.status === undefined ? undefined : { in: query.status },
    };
    //-createdAt = les plus récentes d'abord et l'id départage deux commandes passées à la même milliseconde
    const direction = query.sort === "createdAt" ? "asc" : "desc";
    const items = await prisma.order.findMany({
      where: where,
      include: details,
      orderBy: [{ createdAt: direction }, { id: direction }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    const total = await prisma.order.count({ where: where });
    return { items: items, total: total };
  }
}