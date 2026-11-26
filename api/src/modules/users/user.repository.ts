// Le "rangement" des utilisateurs.
// Pour l'instant : un simple tableau en mémoire (vidé à chaque redémarrage).
// Plus tard, ton binôme fera une version Prisma avec les 3 mêmes méthodes.
import type { AuthUserStore, Role, StoredUser } from "../../fourni/auth/index.js";

// "implements AuthUserStore" = on promet d'avoir les 3 méthodes
// que le module d'auth fourni attend
export class InMemoryUserRepository implements AuthUserStore {
  users: StoredUser[] = [];

  // Chercher un utilisateur par son email
  async findByEmail(email: string) {
    for (const user of this.users) {
      if (user.email === email) {
        return user;
      }
    }
    return null; // pas trouvé
  }

  // Chercher un utilisateur par son id
  async findById(id: number) {
    for (const user of this.users) {
      if (user.id === id) {
        return user;
      }
    }
    return null; // pas trouvé
  }

  // Ajouter un utilisateur
  async create(data: { email: string; name: string; passwordHash: string; role: Role }) {
    const user: StoredUser = {
      id: this.users.length + 1,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
    };
    this.users.push(user);
    return user;
  }
}
