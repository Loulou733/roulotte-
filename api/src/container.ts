// Le "container" : c'est ici, et SEULEMENT ici, qu'on fabrique les objets
// avec "new" et qu'on les branche entre eux.
import { config } from "./config.js";
import { createAuth } from "./fourni/auth/index.js";
import { MenuController } from "./modules/menu/controller.js";
import { PrismaMenuRepository } from "./modules/menu/prisma-repository.js";
import { MenuService } from "./modules/menu/service.js";
import { OrderService } from "./modules/orders/orders.service.js";
import { PrismaOrderRepository } from "./modules/orders/orders.prisma-repository.js";
import { PrismaUserRepository } from "./modules/users/user.prisma-repository.js";

// 1. Le rangement des utilisateurs, dans la base avec Prisma
const users = new PrismaUserRepository();

// 2. Le module d'auth fourni, branché sur notre rangement
const auth = createAuth({
  users: users,
  jwtSecret: config.JWT_SECRET,
  jwtExpiresIn: config.JWT_EXPIRES_IN,
});

// 3. La carte : repository -> service -> controller
const menuRepository = new PrismaMenuRepository();
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// 4. Les commandes : le service a besoin de la carte pour retrouver les plats (findByIds)
const orderService = new OrderService(new PrismaOrderRepository(), menuRepository);

// 5. On range tout dans une seule boîte, donnée à createApp
export const container = {
  config: config,
  users: users,
  auth: auth,
  menuRepository: menuRepository,
  menuController: menuController,
  orderService: orderService,
};

// Le type de la boîte (pour que createApp sache ce qu'il y a dedans)
export type Container = typeof container;
