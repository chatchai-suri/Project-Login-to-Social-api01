import { PrismaClient } from "../generated/prisma/client.js"

// Create a new instance of the Prisma Client with logging enabled
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Ensure that the Prisma Client instance is properly disconnected when the Node.js process ends
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;