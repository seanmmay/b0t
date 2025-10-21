import { describe, it, expect, beforeEach } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptAccountTokens,
  decryptAccountTokens,
  isEncryptionConfigured,
} from './crypto';

describe('crypto', () => {
  beforeEach(() => {
    // Ensure AUTH_SECRET is set for tests
    process.env.AUTH_SECRET = 'test-secret-key-for-encryption-minimum-32-chars-long';
  });

  describe('encrypt', () => {
    it('should encrypt a string value', async () => {
      const plaintext = 'my-secret-token';
      const encrypted = await encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
    });

    it('should return null for null input', async () => {
      const result = await encrypt(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', async () => {
      const result = await encrypt(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', async () => {
      const result = await encrypt('');
      expect(result).toBeNull();
    });

    it('should produce different ciphertexts for same input (due to random IV)', async () => {
      const plaintext = 'my-secret-token';
      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt long strings', async () => {
      const longText = 'a'.repeat(10000);
      const encrypted = await encrypt(longText);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(longText);
    });

    it('should encrypt special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = await encrypt(specialChars);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(specialChars);
    });

    it('should encrypt unicode characters', async () => {
      const unicode = '你好世界 🚀 مرحبا';
      const encrypted = await encrypt(unicode);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(unicode);
    });

    it('should throw error when AUTH_SECRET is missing', async () => {
      delete process.env.AUTH_SECRET;

      await expect(encrypt('test')).rejects.toThrow('Failed to encrypt data');

      // Restore for other tests
      process.env.AUTH_SECRET = 'test-secret-key-for-encryption-minimum-32-chars-long';
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted value', async () => {
      const plaintext = 'my-secret-token';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return null for null input', async () => {
      const result = await decrypt(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', async () => {
      const result = await decrypt(undefined);
      expect(result).toBeNull();
    });

    it('should decrypt long strings', async () => {
      const longText = 'a'.repeat(10000);
      const encrypted = await encrypt(longText);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });

    it('should decrypt special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = await encrypt(specialChars);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    it('should decrypt unicode characters', async () => {
      const unicode = '你好世界 🚀 مرحبا';
      const encrypted = await encrypt(unicode);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(unicode);
    });

    it('should throw error for tampered ciphertext', async () => {
      const plaintext = 'my-secret-token';
      const encrypted = await encrypt(plaintext);

      // Tamper with the ciphertext by changing a character
      const buffer = Buffer.from(encrypted!, 'base64');
      buffer[10] = buffer[10] ^ 0xFF; // Flip bits in the middle
      const tampered = buffer.toString('base64');

      await expect(decrypt(tampered)).rejects.toThrow();
    });

    it('should throw error for invalid base64', async () => {
      const invalid = 'not-valid-base64!!!';

      await expect(decrypt(invalid)).rejects.toThrow('Failed to decrypt data');
    });

    it('should throw error when AUTH_SECRET is missing', async () => {
      const plaintext = 'test';
      const encrypted = await encrypt(plaintext);

      delete process.env.AUTH_SECRET;

      await expect(decrypt(encrypted)).rejects.toThrow('Failed to decrypt data');

      // Restore for other tests
      process.env.AUTH_SECRET = 'test-secret-key-for-encryption-minimum-32-chars-long';
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should maintain data integrity through multiple round trips', async () => {
      const original = 'my-secret-token';

      const encrypted1 = await encrypt(original);
      const decrypted1 = await decrypt(encrypted1);
      expect(decrypted1).toBe(original);

      const encrypted2 = await encrypt(decrypted1!);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted2).toBe(original);

      const encrypted3 = await encrypt(decrypted2!);
      const decrypted3 = await decrypt(encrypted3);
      expect(decrypted3).toBe(original);
    });

    it('should work with various data types converted to strings', async () => {
      const testCases = [
        '123',
        'true',
        'null',
        JSON.stringify({ key: 'value' }),
        JSON.stringify([1, 2, 3]),
      ];

      for (const testCase of testCases) {
        const encrypted = await encrypt(testCase);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      }
    });
  });

  describe('encryptAccountTokens', () => {
    it('should encrypt all token fields', async () => {
      const account = {
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        id_token: 'id-789',
      };

      const encrypted = await encryptAccountTokens(account);

      expect(encrypted.access_token).not.toBe(account.access_token);
      expect(encrypted.refresh_token).not.toBe(account.refresh_token);
      expect(encrypted.id_token).not.toBe(account.id_token);
      expect(encrypted.access_token).toBeTruthy();
      expect(encrypted.refresh_token).toBeTruthy();
      expect(encrypted.id_token).toBeTruthy();
    });

    it('should handle null tokens', async () => {
      const account = {
        access_token: null,
        refresh_token: null,
        id_token: null,
      };

      const encrypted = await encryptAccountTokens(account);

      expect(encrypted.access_token).toBeNull();
      expect(encrypted.refresh_token).toBeNull();
      expect(encrypted.id_token).toBeNull();
    });

    it('should preserve other fields', async () => {
      const account = {
        id: 'account-1',
        provider: 'twitter',
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        id_token: null,
        userId: 'user-1',
      };

      const encrypted = await encryptAccountTokens(account);

      expect(encrypted.id).toBe(account.id);
      expect(encrypted.provider).toBe(account.provider);
      expect(encrypted.userId).toBe(account.userId);
      expect(encrypted.access_token).not.toBe(account.access_token);
      expect(encrypted.refresh_token).not.toBe(account.refresh_token);
      expect(encrypted.id_token).toBeNull();
    });
  });

  describe('decryptAccountTokens', () => {
    it('should decrypt all token fields', async () => {
      const original = {
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        id_token: 'id-789',
      };

      const encrypted = await encryptAccountTokens(original);
      const decrypted = await decryptAccountTokens(encrypted);

      expect(decrypted.access_token).toBe(original.access_token);
      expect(decrypted.refresh_token).toBe(original.refresh_token);
      expect(decrypted.id_token).toBe(original.id_token);
    });

    it('should handle null tokens', async () => {
      const account = {
        access_token: null,
        refresh_token: null,
        id_token: null,
      };

      const decrypted = await decryptAccountTokens(account);

      expect(decrypted.access_token).toBeNull();
      expect(decrypted.refresh_token).toBeNull();
      expect(decrypted.id_token).toBeNull();
    });

    it('should preserve other fields', async () => {
      const original = {
        id: 'account-1',
        provider: 'twitter',
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        id_token: null,
        userId: 'user-1',
      };

      const encrypted = await encryptAccountTokens(original);
      const decrypted = await decryptAccountTokens(encrypted);

      expect(decrypted.id).toBe(original.id);
      expect(decrypted.provider).toBe(original.provider);
      expect(decrypted.userId).toBe(original.userId);
      expect(decrypted.access_token).toBe(original.access_token);
      expect(decrypted.refresh_token).toBe(original.refresh_token);
      expect(decrypted.id_token).toBeNull();
    });
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when AUTH_SECRET is set', () => {
      process.env.AUTH_SECRET = 'test-secret';
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should return false when AUTH_SECRET is not set', () => {
      delete process.env.AUTH_SECRET;
      expect(isEncryptionConfigured()).toBe(false);

      // Restore for other tests
      process.env.AUTH_SECRET = 'test-secret-key-for-encryption-minimum-32-chars-long';
    });
  });

  describe('security properties', () => {
    it('should use authenticated encryption (detect tampering)', async () => {
      const plaintext = 'my-secret-token';
      const encrypted = await encrypt(plaintext);

      // Try to tamper by modifying a character in the middle
      const buffer = Buffer.from(encrypted!, 'base64');
      buffer[buffer.length - 1] = buffer[buffer.length - 1] ^ 0xFF;
      const tampered = buffer.toString('base64');

      await expect(decrypt(tampered)).rejects.toThrow();
    });

    it('should produce ciphertexts that are not predictable', async () => {
      const plaintext = 'test';
      const ciphertexts = new Set<string>();

      // Generate 10 encryptions
      for (let i = 0; i < 10; i++) {
        const encrypted = await encrypt(plaintext);
        ciphertexts.add(encrypted!);
      }

      // All should be unique (due to random IV)
      expect(ciphertexts.size).toBe(10);
    });

    it('should handle concurrent encryption/decryption', async () => {
      const plaintext = 'concurrent-test';

      const promises = Array.from({ length: 100 }, async (_, i) => {
        const encrypted = await encrypt(plaintext + i);
        const decrypted = await decrypt(encrypted);
        return decrypted === plaintext + i;
      });

      const results = await Promise.all(promises);
      expect(results.every(r => r)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string after encryption', async () => {
      const result = await encrypt('');
      expect(result).toBeNull();
    });

    it('should handle whitespace-only strings', async () => {
      const whitespace = '   ';
      const encrypted = await encrypt(whitespace);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(whitespace);
    });

    it('should handle newlines and tabs', async () => {
      const text = 'Line 1\nLine 2\tTabbed';
      const encrypted = await encrypt(text);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(text);
    });

    it('should handle JSON with nested objects', async () => {
      const json = JSON.stringify({
        user: {
          name: 'Alice',
          tokens: {
            access: 'token1',
            refresh: 'token2',
          },
        },
      });

      const encrypted = await encrypt(json);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(json);
      expect(JSON.parse(decrypted!)).toEqual(JSON.parse(json));
    });
  });
});
