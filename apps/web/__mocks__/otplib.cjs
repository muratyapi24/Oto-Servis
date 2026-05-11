// Jest CJS mock for otplib (ESM + transitive ESM deps not compatible with Jest/CJS)
// Implements RFC 6238 TOTP using Node.js built-in crypto — no external deps.
'use strict';

const crypto = require('crypto');

// RFC 4648 Base32 alphabet
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(encoded) {
  const input = encoded.toUpperCase().replace(/=+$/, '');
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (const char of input) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  while (output.length % 8) output += '=';
  return output;
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(c & 0xffn);
    c >>= 8n;
  }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

function counter(window = 0) {
  return Math.floor(Date.now() / 1000 / 30) + window;
}

const authenticator = {
  options: { window: 1 },

  generateSecret(length = 20) {
    return base32Encode(crypto.randomBytes(length)).replace(/=+$/, '');
  },

  generate(secret) {
    return hotp(secret, counter());
  },

  verify({ token, secret }) {
    const win = (authenticator.options && authenticator.options.window) || 1;
    for (let w = -win; w <= win; w++) {
      if (hotp(secret, counter(w)) === String(token)) return true;
    }
    return false;
  },

  keyuri(account, issuer, secret) {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  },
};

module.exports = { authenticator, totp: authenticator, hotp };
