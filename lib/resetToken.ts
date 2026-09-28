import { createHash, randomBytes } from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

// En la base se guarda solo el hash: si alguien lee la tabla, no puede usar los links.
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
