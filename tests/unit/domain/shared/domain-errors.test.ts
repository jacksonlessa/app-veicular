import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { DomainError } from "@/domain/shared/errors/domain.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

describe("DomainError hierarchy", () => {
  describe("InvalidValueError", () => {
    it("is an instance of DomainError and Error", () => {
      const err = new InvalidValueError("Email", "bad");
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("has correct message format", () => {
      const err = new InvalidValueError("Email", "bad@");
      expect(err.message).toBe("Invalid value for Email: bad@");
    });

    it("exposes field and input", () => {
      const err = new InvalidValueError("Plate", 123);
      expect(err.field).toBe("Plate");
      expect(err.input).toBe(123);
    });

    it("handles null input gracefully", () => {
      const err = new InvalidValueError("Email", null);
      expect(err.message).toBe("Invalid value for Email: null");
      expect(err.input).toBeNull();
    });

    it("sets the name to InvalidValueError", () => {
      const err = new InvalidValueError("Email", "x");
      expect(err.name).toBe("InvalidValueError");
    });
  });

  describe("BusinessRuleError", () => {
    it("is an instance of DomainError and Error", () => {
      const err = new BusinessRuleError("some.code");
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("uses code as message when no custom message provided", () => {
      const err = new BusinessRuleError("email.duplicate");
      expect(err.message).toBe("email.duplicate");
      expect(err.code).toBe("email.duplicate");
    });

    it("uses custom message when provided", () => {
      const err = new BusinessRuleError("fuelup.three_fields", "Exactly 2 of 3 fields required");
      expect(err.message).toBe("Exactly 2 of 3 fields required");
      expect(err.code).toBe("fuelup.three_fields");
    });

    it("sets the name to BusinessRuleError", () => {
      const err = new BusinessRuleError("some.rule");
      expect(err.name).toBe("BusinessRuleError");
    });
  });
});
