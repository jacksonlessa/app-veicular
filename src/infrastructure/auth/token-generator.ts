import { randomBytes } from "node:crypto";
import { TokenGenerator } from "@/application/ports/token-generator";

export class RandomHexTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomBytes(32).toString("hex");
  }
}
