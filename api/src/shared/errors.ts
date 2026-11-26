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
