//npm run seed vide la base puis la remplit avec donnees/menu.json
import { readFileSync } from "node:fs";
import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/fourni/auth/index.js";
const menu = JSON.parse(readFileSync("donnees/menu.json", "utf-8"));
//on vide en commençant par les tables qui pointent vers les autres sinon les clés étrangères bloquent
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.dish.deleteMany();
await prisma.category.deleteMany();
await prisma.allergen.deleteMany();
await prisma.user.deleteMany();
//on remet les compteurs d'id à zéro pour que les plats retrouvent toujours les ids 1 2 3 comme dans la carte en mémoire
await prisma.$executeRaw`DELETE FROM sqlite_sequence`;
for (const category of menu.categories) {
  await prisma.category.create({ data: { name: category.name, position: category.position } });
}
for (const allergen of menu.allergens) {
  await prisma.allergen.create({ data: { code: allergen.code, label: allergen.label } });
}
//dans le json un plat donne le nom de sa catégorie et les codes de ses allergènes donc on les relie avec connect
for (const dish of menu.dishes) {
  const allergens = [];
  for (const code of dish.allergens) {
    allergens.push({ code: code });
  }
  await prisma.dish.create({
    data: {
      name: dish.name,
      description: dish.description,
      priceCents: dish.priceCents,
      available: dish.available,
      stock: dish.stock,
      category: { connect: { name: dish.category } },
      allergens: { connect: allergens },
    },
  });
}
//les 3 comptes de démo  on garde jamais le mot de passe en clair juste son hash
for (const user of menu.users) {
  await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: await hashPassword(user.password),
    },
  });
}
console.log("seed ok");
await prisma.$disconnect();