import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Roles are event data typed by the hosts, in their own language, not interface text.
const roles = ["Guest", "Best man or maid of honor", "Family", "Friends"];

async function main() {
  const event = await db.event.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      slug: "test",
      name: "Test event",
      date: new Date("2026-12-12T19:00:00-03:00"),
      status: "OPEN",
      roles: { create: roles.map((name, order) => ({ name, order })) },
    },
    include: { roles: { orderBy: { order: "asc" } } },
  });

  console.log(
    `Event "${event.name}" (/${event.slug}) with roles: ${event.roles.map((role) => role.name).join(", ")}`,
  );
}

main().finally(() => db.$disconnect());
