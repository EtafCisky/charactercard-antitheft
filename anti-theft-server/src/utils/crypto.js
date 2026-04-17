/**
 * Password Encryption Module
 *
 * This module provides secure password hashing and verification
 * using bcrypt algorithm with 12 salt rounds.
 */

const bcrypt = require("bcrypt");

// Configuration: bcrypt salt rounds
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt
 *
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The bcrypt hash of the password
 * @throws {Error} If password is empty or hashing fails
 *
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: '$2b$12$...' (60-character bcrypt hash)
 */
async function hashPassword(password) {
  // Validate input
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  if (password.length < 1 || password.length > 100) {
    throw new Error("Password length must be between 1 and 100 characters");
  }

  try {
    // Generate salt and hash password
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error("Password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a plaintext password against a bcrypt hash
 *
 * @param {string} password - The plaintext password to verify
 * @param {string} hash - The bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 * @throws {Error} If inputs are invalid or verification fails
 *
 * @example
 * const isValid = await verifyPassword('myPassword', storedHash);
 * if (isValid) {
 *   console.log('Password is correct');
 * }
 */
async function verifyPassword(password, hash) {
  // Validate inputs
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  if (!hash || typeof hash !== "string") {
    throw new Error("Hash must be a non-empty string");
  }

  try {
    // Compare password with hash
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error("Password verification failed:", error);
    throw new Error("Failed to verify password");
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  SALT_ROUNDS,
};
