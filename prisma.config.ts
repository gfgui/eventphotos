import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // process.env instead of env(): `prisma generate` must work without a database (Docker build).
  datasource: { url: process.env.DATABASE_URL },
});
