//la version prisma du rangement des utilisateurs  les 3 méthodes que le module d'auth attend
import { prisma } from "../../db/prisma.js";
import type { AuthUserStore, Role } from "../../fourni/auth/index.js";
export class PrismaUserRepository implements AuthUserStore {
  //null si personne a cet email
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email } });
  }
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id: id } });
  }
  //le mot de passe arrive déjà haché par le module d'auth
  async create(data: { email: string; name: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data: data });
  }
}
