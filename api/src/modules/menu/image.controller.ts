//reçoit la photo envoyée en formulaire multipart  multer la garde en mémoire avec une limite de 2 Mo
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { AppError } from "../../shared/errors.js";
import type { DishImageService } from "./image.service.js";
const idSchema = z.coerce.number().int().min(1);
const parser = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
//multer lit le champ image  ses erreurs sont mises au format du contrat
export function receiveImage(req: Request, res: Response, next: NextFunction) {
  parser.single("image")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError(413, "PAYLOAD_TOO_LARGE", "Photo trop lourde : 2 Mo maximum"));
    } else if (error instanceof multer.MulterError) {
      next(new AppError(400, "VALIDATION_ERROR", "Données invalides", [{ path: "image", message: error.message }]));
    } else {
      next(error);
    }
  });
}
export function createImageController(service: DishImageService) {
  //PUT /dishes/:id/image=200 avec le plat et sa nouvelle imageUrl
  async function upload(req: Request, res: Response) {
    const id = idSchema.parse(req.params.id);
    if (req.file === undefined) {
      throw new AppError(400, "VALIDATION_ERROR", "Données invalides", [{ path: "image", message: "Photo obligatoire" }]);
    }
    const dish = await service.setImage(id, req.file.buffer);
    res.json(dish);
  }
  return { upload };
}
