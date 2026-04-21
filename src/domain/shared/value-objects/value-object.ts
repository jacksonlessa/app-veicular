export abstract class ValueObject<T> {
  protected constructor(public readonly value: T) {}

  equals(other: ValueObject<T>): boolean {
    return other?.constructor === this.constructor && other.value === this.value;
  }
}
