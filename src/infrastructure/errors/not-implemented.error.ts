export class NotImplementedError extends Error {
  constructor(method: string, phase: string) {
    super(`${method} not implemented — will be completed in ${phase}`);
    this.name = "NotImplementedError";
  }
}
