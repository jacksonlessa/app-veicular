import { describe, it, expect } from "vitest";
import { RandomHexTokenGenerator } from "@/infrastructure/auth/token-generator";

describe("RandomHexTokenGenerator", () => {
  const generator = new RandomHexTokenGenerator();

  it("generates a 64-character lowercase hex string", () => {
    const token = generator.generate();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates 100 tokens all matching the hex regex", () => {
    const tokens = Array.from({ length: 100 }, () => generator.generate());
    for (const token of tokens) {
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("generates 100 unique tokens", () => {
    const tokens = Array.from({ length: 100 }, () => generator.generate());
    expect(new Set(tokens).size).toBe(100);
  });
});
