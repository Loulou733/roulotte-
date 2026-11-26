//la version prisma du repository des commandes c'est le seul fichier des commandes qui parle à la base
import { prisma } from "../../db/prisma.js";
import type { ListOrdersQuery, Order } from "./orders.dto.js";
import type { NewOrder, OrderRepository } from "./orders.repository.js";
//ce qu'on ramène avec chaque commande  le client juste id et nom et le nom des plats
//écrit une seule fois et utilisé par les 3 méthodes
const details = {
  customer: { select: { id: true, name: true } },
  items: { include: { dish: { select: { name: true } } } },
};
export class PrismaOrderRepository implements OrderRepository {
  //la commande et ses lignes sont créées d'un coup avec items create
  async create(order: NewOrder): Promise<Order> {
    return prisma.order.create({
      data: {
        customerId: order.customerId,
        note: order.note,
        totalCents: order.totalCents,
        items: { create: order.items },
      },
      include: details,
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