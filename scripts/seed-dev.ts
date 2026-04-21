import { PrismaClient } from "@prisma/client";
import { Argon2PasswordHasher } from "../src/infrastructure/auth/password-hasher";

const prisma = new PrismaClient();
const email = process.env.SEED_EMAIL ?? "dev@rodagem.app";
const password = process.env.SEED_PASSWORD ?? "dev123456";

async function main() {
  const hasher = new Argon2PasswordHasher();
  const hash = await hasher.hash(password);
  const account = await prisma.account.upsert({
    where: { id: "seed-account" },
    update: {},
    create: { id: "seed-account", name: "Dev Account" },
  });
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: {
      accountId: account.id,
      name: "Dev User",
      email,
      passwordHash: hash,
    },
  });
  console.log(`seeded: ${email} / ${password}`);
}

main().finally(() => prisma.$disconnect());
