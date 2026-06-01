import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";

import type { CheckoutPlanId } from "./constants";

const ACCESS_CODE_ENCRYPTION_PREFIX = "aes256gcm";
const ACCESS_CODE_IV_LENGTH = 12;

function getAccessCodeEncryptionKey() {
  const source = env.checkoutCodeEncryptionKey || env.serviceRoleKey;

  if (!source) {
    throw new Error(
      "Missing CHECKOUT_CODE_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY. Server-side access code encryption cannot run without a key source.",
    );
  }

  // Hash the source into a stable 32-byte key so existing env values can be used safely.
  return createHash("sha256").update(source).digest();
}

export function encryptStoredAccessCode(rawCode: string) {
  const key = getAccessCodeEncryptionKey();
  const iv = randomBytes(ACCESS_CODE_IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(rawCode, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ACCESS_CODE_ENCRYPTION_PREFIX,
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join("$");
}

export function decryptStoredAccessCode(storedValue: string | null | undefined) {
  if (!storedValue) {
    return null;
  }

  const [prefix, ivHex, authTagHex, encryptedHex] = storedValue.split("$");

  if (
    prefix !== ACCESS_CODE_ENCRYPTION_PREFIX ||
    !ivHex ||
    !authTagHex ||
    !encryptedHex
  ) {
    return null;
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getAccessCodeEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function createRandomAccessCodeChunk() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBuffer = randomBytes(4);

  return Array.from(randomBuffer, (value) => alphabet[value % alphabet.length]).join("");
}

export function generateReadableAccessCode(planId: CheckoutPlanId) {
  const planSegmentById: Record<CheckoutPlanId, string> = {
    light: "LIGHT",
    core: "CORE",
    intensive: "INTENSIVE",
  };

  return `DEEBO-${planSegmentById[planId]}-${createRandomAccessCodeChunk()}`;
}
