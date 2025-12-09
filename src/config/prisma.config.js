import { PrismaClient } from "../generated/prisma/client.js"

// import DATABASE_URL from environment variables (.env)
const DATABASE_URL = process.env.DATABASE_URL

// Create a new instance of the Prisma Client with logging enabled
const prisma = new PrismaClient({

  // add the datasource url from environment variables
  // as recommneded from prisma alarm to move datasource url from schema.prisma to environment (.env) variables for security reason
  datasourceUrl: DATABASE_URL,
  log: ["query", "info", "warn", "error"],
});

// Ensure that the Prisma Client instance is properly disconnected when the Node.js process ends
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;