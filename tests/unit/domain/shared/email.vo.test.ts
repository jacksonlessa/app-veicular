import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";

describe("Email VO", () => {
  describe("create — happy path", () => {
    it("accepts a valid email", () => {
      const email = Email.create("user@example.com");
      expect(email.value).toBe("user@example.com");
    });

    it("trims whitespace and lowercases the value", () => {
      const email = Email.create("  X@Y.com ");
      expect(email.value).toBe("x@y.com");
    });

    it("lowercases an already-trimmed email", () => {
      const email = Email.create("ADMIN@DOMAIN.ORG");
      expect(email.value).toBe("admin@domain.org");
    });

    it("accepts email with subdomains", () => {
      const email = Email.create("user@mail.example.co.uk");
      expect(email.value).toBe("user@mail.example.co.uk");
    });

    it("accepts email with plus addressing", () => {
      const email = Email.create("user+tag@example.com");
      expect(email.value).toBe("user+tag@example.com");
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for plain string without @", () => {
      expect(() => Email.create("abc")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for missing domain part", () => {
      expect(() => Email.create("user@")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for missing TLD", () => {
      expect(() => Email.create("user@domain")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for empty string", () => {
      expect(() => Email.create("")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for whitespace-only string", () => {
      expect(() => Email.create("   ")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for email with spaces inside", () => {
      expect(() => Email.create("us er@example.com")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for multiple @ signs", () => {
      expect(() => Email.create("a@b@c.com")).toThrow(InvalidValueError);
    });

    it("includes the original input in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        Email.create("bad-input");
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("Email");
      expect(err?.input).toBe("bad-input");
    });
  });

  describe("equals", () => {
    it("returns true for two emails with the same normalized value", () => {
      const a = Email.create("User@Example.com");
      const b = Email.create("user@example.com");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for emails with different values", () => {
      const a = Email.create("a@example.com");
      const b = Email.create("b@example.com");
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = Email.create("a@example.com");
      expect(a.equals(null as unknown as Email)).toBe(false);
    });
  });
});
