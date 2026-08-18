const crypto = require('crypto');

/**
 * generateOtp - returns a random zero-padded 6-digit numeric string, e.g. "042917".
 */
function generateOtp() {
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, '0');
}

/**
 * hashOtp - one-way hash of an OTP for storage. OTPs are short-lived and
 * rate-limited (see otpAttempts in the User model), so sha256 is sufficient
 * here; bcrypt's slow hashing isn't necessary for a 6-digit, 10-minute code.
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * otpMatches - compares a plaintext OTP against a stored hash.
 */
function otpMatches(otp, hash) {
  return hashOtp(otp) === hash;
}

module.exports = { generateOtp, hashOtp, otpMatches };
