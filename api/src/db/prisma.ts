//le client prisma unique pour toute l'api donc un singleton branché sur sqlite
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
//prisma 7 passe par un adaptateur pour parler à sqlite
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
export const prisma = new PrismaClient({ adapter });