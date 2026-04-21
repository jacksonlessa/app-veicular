import { describe, it, expect } from "vitest";
import { Argon2PasswordHasher } from "@/infrastructure/auth/password-hasher";

describe("Argon2PasswordHasher", () => {
  const hasher = new Argon2PasswordHasher();

  it("hash + verify round-trip returns true for correct password", async () => {
    const hash = await hasher.hash("minha-senha-segura");
    const result = await hasher.verify(hash, "minha-senha-segura");
    expect(result).toBe(true);
  });

  it("verify returns false for wrong password", async () => {
    const hash = await hasher.hash("senha-correta");
    const result = await hasher.verify(hash, "senha-errada");
    expect(result).toBe(false);
  });

  it("generated hash does not contain the plain-text password", async () => {
    const plain = "segredo123";
    const hash = await hasher.hash(plain);
    expect(hash).not.toContain(plain);
  });

  it("verify returns false for invalid hash string", async () => {
    const result = await hasher.verify("hash-invalido-qualquer", "qualquer");
    expect(result).toBe(false);
  });
});
