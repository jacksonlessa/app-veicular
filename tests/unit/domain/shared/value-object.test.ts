import { describe, expect, it } from "vitest";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

class StringVO extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }
}

class OtherVO extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }
}

describe("ValueObject", () => {
  it("stores the value", () => {
    const vo = new StringVO("hello");
    expect(vo.value).toBe("hello");
  });

  it("equals returns true for same type and same value", () => {
    const a = new StringVO("hello");
    const b = new StringVO("hello");
    expect(a.equals(b)).toBe(true);
  });

  it("equals returns false for same type but different value", () => {
    const a = new StringVO("hello");
    const b = new StringVO("world");
    expect(a.equals(b)).toBe(false);
  });

  it("equals returns false for different types with same value", () => {
    const a = new StringVO("hello");
    const b = new OtherVO("hello");
    expect(a.equals(b as unknown as StringVO)).toBe(false);
  });

  it("equals returns false when other is null-like", () => {
    const a = new StringVO("hello");
    expect(a.equals(null as unknown as StringVO)).toBe(false);
  });
});
