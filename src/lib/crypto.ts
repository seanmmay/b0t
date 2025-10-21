import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { logger } from './logger';

/**
 * Encryption Utility for OAuth Tokens
 *
 * Uses AES-256-GCM encryption to secure OAuth tokens in the database.
 * Derives encryption key from AUTH_SECRET (no additional env var needed).
 *
 * Format: base64(iv:authTag:ciphertext)
 */

const scryptAsync = promisify(scrypt);

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT = 'social-cat-token-encryption'; // Static salt for deterministic key derivation

/**
 * Derive encryption key from AUTH_SECRET
 */
async function deriveKey(): Promise<Buffer> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is required for token encryption');
  }

  // Derive a 256-bit key from AUTH_SECRET using scrypt
  const key = await scryptAsync(secret, SALT, KEY_LENGTH);
  return key as Buffer;
}

/**
 * Encrypt a string value
 *
 * @param plaintext - The value to encrypt
 * @returns Encrypted value in format: base64(iv:authTag:ciphertext)
 */
export async function encrypt(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext) return null;

  try {
    const key = await deriveKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine iv, authTag, and encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);

    return combined.toString('base64');
  } catch (error) {
    logger.error({ error }, 'Encryption failed');
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string value
 *
 * @param ciphertext - The encrypted value from database
 * @returns Decrypted plaintext value
 */
export async function decrypt(ciphertext: string | null | undefined): Promise<string | null> {
  if (!ciphertext) return null;

  try {
    const key = await deriveKey();
    const combined = Buffer.from(ciphertext, 'base64');

    // Extract iv, authTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error({ error }, 'Decryption failed');
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt OAuth account tokens
 *
 * @param account - Account object with tokens to encrypt
 * @returns Account object with encrypted tokens
 */
export async function encryptAccountTokens<T extends {
  access_token?: string | null;
  refresh_token?: string | null;
  id_token?: string | null;
}>(account: T): Promise<T> {
  return {
    ...account,
    access_token: await encrypt(account.access_token),
    refresh_token: await encrypt(account.refresh_token),
    id_token: await encrypt(account.id_token),
  };
}

/**
 * Decrypt OAuth account tokens
 *
 * @param account - Account object with encrypted tokens
 * @returns Account object with decrypted tokens
 */
export async function decryptAccountTokens<T extends {
  access_token?: string | null;
  refresh_token?: string | null;
  id_token?: string | null;
}>(account: T): Promise<T> {
  return {
    ...account,
    access_token: await decrypt(account.access_token),
    refresh_token: await decrypt(account.refresh_token),
    id_token: await decrypt(account.id_token),
  };
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.AUTH_SECRET;
}
