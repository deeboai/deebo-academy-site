import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { sanitizePlainText } from "../input-security";

const ACCESS_CODE_HASH_PREFIX = "scrypt";
const ACCESS_CODE_HASH_KEY_LENGTH = 64;

export function normalizeAccessCode(value: string) {
  return sanitizePlainText(value, { maxLength: 120 }).toUpperCase();
}

export function createAccessCodeHash(rawCode: string) {
  const normalizedCode = normalizeAccessCode(rawCode);
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(normalizedCode, salt, ACCESS_CODE_HASH_KEY_LENGTH).toString("hex");

  return `${ACCESS_CODE_HASH_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyAccessCodeHash(rawCode: string, storedHash: string) {
  const [prefix, salt, derivedKey] = storedHash.split("$");

  if (prefix !== ACCESS_CODE_HASH_PREFIX || !salt || !derivedKey) {
    return false;
  }

  const normalizedCode = normalizeAccessCode(rawCode);
  const computedKey = scryptSync(normalizedCode, salt, ACCESS_CODE_HASH_KEY_LENGTH);
  const storedKey = Buffer.from(derivedKey, "hex");

  if (computedKey.byteLength !== storedKey.byteLength) {
    return false;
  }

  return timingSafeEqual(computedKey, storedKey);
}
