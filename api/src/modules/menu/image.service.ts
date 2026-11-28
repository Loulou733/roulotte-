//la photo d'un plat  type vérifié sur le contenu  nom choisi par le serveur  l'ancienne photo supprimée
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "../../shared/errors.js";
import type { ImageStorage } from "./image-storage.js";
import type { DishImageRepository, MenuRepository } from "./repository.js";
//les seuls types acceptés
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
export class DishImageService {
  menu: MenuRepository;
  dishes: DishImageRepository;
  images: ImageStorage;
  constructor(menu: MenuRepository, dishes: DishImageRepository, images: ImageStorage) {
    this.menu = menu;
    this.dishes = dishes;
    this.images = images;
  }
  //PUT /dishes/:id/image
  async setImage(dishId: number, content: Buffer) {
    const dish = await this.menu.findDishById(dishId);
    if (dish === null) {
      throw new AppError(404, "NOT_FOUND", "Plat introuvable");
    }
    //le type annoncé par le navigateur se falsifie donc file-type lit les premiers octets du fichier
    const type = await fileTypeFromBuffer(content);
    if (type === undefined || !ALLOWED.includes(type.mime)) {
      throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "La photo doit être en PNG, JPEG ou WebP");
    }
    //un nom au hasard  jamais celui envoyé par le client
    const imageUrl = await this.images.save(randomUUID() + "." + type.ext, content);
    const updated = await this.dishes.setImage(dishId, imageUrl);
    if (updated === null) {
      throw new AppError(404, "NOT_FOUND", "Plat introuvable");
    }
    //la nouvelle photo est en place donc on supprime l'ancienne
    if (dish.imageUrl !== null) {
      await this.images.remove(dish.imageUrl);
    }
    return updated;
  }
}
