import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Une erreur "prévue" de l'application (plat introuvable, données invalides...).
// Elle contient tout ce qu'il faut pour répondre au client :
//   status  -> le code HTTP (404, 400, 409...)
//   code    -> un code texte du contrat (ex : "NOT_FOUND")
//   message -> une phrase lisible par un humain
//   details -> des infos en plus (facultatif)
export class AppError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message); // on donne le message à la classe Error de base
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Appelé quand aucune route ne correspond à l'URL demandée
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route inconnue" } });
}

// LE gestionnaire d'erreurs : toutes les erreurs lancées avec "throw" arrivent ici.
// Express le reconnaît parce qu'il a 4 paramètres (err, req, res, next).
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Cas 1 : une erreur à nous (AppError)
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Cas 2 : Zod a refusé des données (ex : /dishes/abc)
  if (err instanceof ZodError) {
    const details = [];
    for (const issue of err.issues) {
      details.push({ path: issue.path.join("."), message: issue.message });
    }
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Données invalides", details: details },
    });
    return;
  }

  // Cas 3 : une erreur imprévue (un bug) -> 500, sans montrer les détails au client
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erreur interne" } });
}
