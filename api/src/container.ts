// Le "container" : c'est ici, et SEULEMENT ici, qu'on fabrique les objets
// avec "new" et qu'on les branche entre eux.
import { config } from "./config.js";
import { createAuth } from "./fourni/auth/index.js";
import { MenuController } from "./modules/menu/controller.js";
import { InMemoryMenuRepository } from "./modules/menu/repository.js";
import { MenuService } from "./modules/menu/service.js";
import { InMemoryUserRepository } from "./modules/users/user.repository.js";

// 1. Le rangement des utilisateurs
const users = new InMemoryUserRepository();

// 2. Le module d'auth fourni, branché sur notre rangement
const auth = createAuth({
  users: users,
  jwtSecret: config.JWT_SECRET,
  jwtExpiresIn: config.JWT_EXPIRES_IN,
});

// 3. La carte : repository -> service -> controller
const menuRepository = new InMemoryMenuRepository();
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// 4. On range tout dans une seule boîte, donnée à createApp
export const container = {
  config: config,
  users: users,
  auth: auth,
  menuRepository: menuRepository, // le binôme en aura besoin pour les commandes (findByIds)
  menuController: menuController,
};

// Le type de la boîte (pour que createApp sache ce qu'il y a dedans)
export type Container = typeof container;
