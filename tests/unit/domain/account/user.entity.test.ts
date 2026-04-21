import { describe, expect, it } from "vitest";
import { User } from "@/domain/account/entities/user.entity";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";

const validEmail = Email.create("user@example.com");

const validInput = {
  id: "user-1",
  accountId: "acc-1",
  name: "Jane Doe",
  email: validEmail,
  passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$hashedpassword",
};

describe("User entity", () => {
  describe("create — happy path", () => {
    it("creates a user with valid inputs", () => {
      const user = User.create(validInput);
      expect(user.id).toBe("user-1");
      expect(user.accountId).toBe("acc-1");
      expect(user.name).toBe("Jane Doe");
      expect(user.email).toBe(validEmail);
      expect(user.passwordHash).toBe(validInput.passwordHash);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("sets createdAt to a recent timestamp", () => {
      const before = Date.now();
      const user = User.create(validInput);
      const after = Date.now();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("create — invalid name", () => {
    it("throws InvalidValueError for empty name", () => {
      expect(() => User.create({ ...validInput, name: "" })).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for whitespace-only name", () => {
      expect(() => User.create({ ...validInput, name: "   " })).toThrow(InvalidValueError);
    });

    it("includes User.name as the field in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        User.create({ ...validInput, name: "" });
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("User.name");
    });
  });

  describe("create — invalid passwordHash", () => {
    it("throws InvalidValueError for empty passwordHash", () => {
      expect(() => User.create({ ...validInput, passwordHash: "" })).toThrow(InvalidValueError);
    });

    it("includes User.passwordHash as the field in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        User.create({ ...validInput, passwordHash: "" });
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("User.passwordHash");
      expect(err?.input).toBe("empty");
    });
  });

  describe("rehydrate — no revalidation", () => {
    it("rehydrates without throwing for any stored data", () => {
      const date = new Date("2024-01-01");
      const user = User.rehydrate({
        id: "user-2",
        accountId: "acc-2",
        name: "",
        email: validEmail,
        passwordHash: "",
        createdAt: date,
      });
      expect(user.id).toBe("user-2");
      expect(user.accountId).toBe("acc-2");
      expect(user.name).toBe("");
      expect(user.passwordHash).toBe("");
      expect(user.createdAt).toBe(date);
    });

    it("preserves all props as provided", () => {
      const date = new Date("2023-06-15T10:30:00Z");
      const user = User.rehydrate({
        id: "user-xyz",
        accountId: "acc-xyz",
        name: "Persisted User",
        email: validEmail,
        passwordHash: "some-hash",
        createdAt: date,
      });
      expect(user.id).toBe("user-xyz");
      expect(user.name).toBe("Persisted User");
      expect(user.email).toBe(validEmail);
      expect(user.createdAt).toBe(date);
    });
  });
});
