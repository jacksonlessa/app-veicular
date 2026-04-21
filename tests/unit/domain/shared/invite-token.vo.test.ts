import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";

const VALID_TOKEN = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // 32 hex chars

describe("InviteToken VO", () => {
  describe("create — happy path", () => {
    it("accepts a valid 32-char hex token", () => {
      const token = InviteToken.create(VALID_TOKEN);
      expect(token.value).toBe(VALID_TOKEN);
    });

    it("accepts a token longer than 32 hex chars", () => {
      const long = VALID_TOKEN + "abcdef";
      const token = InviteToken.create(long);
      expect(token.value).toBe(long);
    });

    it("accepts uppercase hex chars", () => {
      const upper = VALID_TOKEN.toUpperCase();
      const token = InviteToken.create(upper);
      expect(token.value).toBe(upper);
    });

    it("trims surrounding whitespace before validation", () => {
      const token = InviteToken.create(`  ${VALID_TOKEN}  `);
      expect(token.value).toBe(VALID_TOKEN);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for empty string", () => {
      expect(() => InviteToken.create("")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for whitespace-only string", () => {
      expect(() => InviteToken.create("   ")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for token shorter than 32 chars", () => {
      expect(() => InviteToken.create("a1b2c3d4")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for non-hex characters", () => {
      const nonHex = "g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // 'g' is invalid
      expect(() => InviteToken.create(nonHex)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for token with spaces inside", () => {
      const withSpaces = "a1b2c3d4 e5f6a1b2 c3d4e5f6 a1b2c3d4";
      expect(() => InviteToken.create(withSpaces)).toThrow(InvalidValueError);
    });

    it("includes the original input in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        InviteToken.create("short");
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("InviteToken");
      expect(err?.input).toBe("short");
    });
  });

  describe("equals", () => {
    it("returns true for two tokens with the same value", () => {
      const a = InviteToken.create(VALID_TOKEN);
      const b = InviteToken.create(VALID_TOKEN);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for two tokens with different values", () => {
      const other = "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5";
      const a = InviteToken.create(VALID_TOKEN);
      const b = InviteToken.create(other);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = InviteToken.create(VALID_TOKEN);
      expect(a.equals(null as unknown as InviteToken)).toBe(false);
    });
  });
});
