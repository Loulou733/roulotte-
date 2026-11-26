// Lit le .env et VÉRIFIE avec Zod qu'il ne manque rien.
// Si une variable manque ou est fausse, l'API refuse de démarrer.
import { existsSync } from "node:fs";
import { z } from "zod";

// 1. Mettre le contenu du fichier .env dans process.env
//    (on vérifie d'abord qu'il existe, sinon Node plante)
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

// 2. Décrire ce qu'on attend
const schema = z.object({
  PORT: z.coerce.number(), // "3000" (texte) devient 3000 (nombre)
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16), // 16 caractères minimum
  JWT_EXPIRES_IN: z.string(),
  CORS_ORIGIN: z.string(),
});

// 3. Vérifier. Si c'est faux, Zod lance une erreur et l'API s'arrête.
export const config = schema.parse(process.env);
