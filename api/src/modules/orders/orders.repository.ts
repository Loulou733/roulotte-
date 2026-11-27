//ce que le service peut demander à la base pour les commandes : créer lire lister
//la version prisma vient après et pour les tests on en fera une fausse
import type { ListOrdersQuery, Order } from "./orders.dto.js";
//ce qu'il faut pour enregistrer une commande les prix viennent déjà de la base
export type NewOrder = {
  customerId: number;
  note: string | null;
  totalCents: number;
  items: { dishId: number; quantity: number; unitPriceCents: number }[];
};
export interface OrderRepository {
  create(order: NewOrder): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  //customerId vide = toutes les commandes cusiine et admin
  //passe de from à to  restock=true remet les portions en stock (annulation)  409 si la commande a changé entre temps
  changeStatus(id: number, from: string, to: string, restock: boolean): Promise<Order>;
  list(customerId: number | undefined, query: ListOrdersQuery): Promise<{ items: Order[]; total: number }>;
}
//coté carte le service a juste besoin de retrouver des plats avec leurs ids
export type DishForOrder = { id: number; priceCents: number; available: boolean };

export interface DishReader {
  findByIds(ids: number[]): Promise<DishForOrder[]>;
}