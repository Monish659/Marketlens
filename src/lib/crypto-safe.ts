import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:v1:";

function getKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY || "";
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSensitiveText(input: string) {
  if (!input) return input;
  const key = getKey();
  if (!key) return input;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(input, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSensitiveText(input: string) {
  if (!input || !input.startsWith(ENCRYPTION_PREFIX)) return input;
  const key = getKey();
  if (!key) return input;

  try {
    const payload = input.slice(ENCRYPTION_PREFIX.length);
    const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) return input;

    const iv = Buffer.from(ivRaw, "base64url");
    const tag = Buffer.from(tagRaw, "base64url");
    const encrypted = Buffer.from(encryptedRaw, "base64url");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.warn("Failed to decrypt encrypted payload:", error);
    return input;
  }
}

