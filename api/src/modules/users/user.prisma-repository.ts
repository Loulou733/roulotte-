// Le rangement des utilisateurs dans la vraie base (Prisma/SQLite).
// Mêmes 3 méthodes que la version en mémoire : le module d'auth ne voit pas la différence.
import { prisma } from "../../db/prisma.js";
import type { AuthUserStore, Role } from "../../fourni/auth/index.js";

export class PrismaUserRepository implements AuthUserStore {
  // Chercher un utilisateur par son email (null si absent)
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email } });
  }

  // Chercher un utilisateur par son id (null si absent)
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id: id } });
  }

  // Ajouter un utilisateur
  async create(data: { email: string; name: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data: data });
  }
}
