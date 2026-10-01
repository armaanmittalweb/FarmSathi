/**
 * Small crypto: password hashes, session tokens, SHA-256 and constant-time comparison.
 *
 * Passwords are hashed with PBKDF2-SHA256 at 100,000 rounds (the most Workers allows), as the
 * contract asks: unlike SafeSpace, the server receives the password itself, so the rounds are what
 * slows down guessing from a stolen table. One hash per sign-in or sign-up fits the CPU budget.
 *
 * Hash format: pbkdf2_sha256$<iterations>$<salt b64url>$<hash b64url>
 */
const enc = new TextEncoder()
export const PASSWORD_ITERATIONS = 100_000
const MAX_ITERATIONS = 100_000 // Workers rejects more than this

export const b64url = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
export const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

/** Compares without an early exit, so response time says nothing about how much matched. */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

export const sameString = (a: string, b: string) => sameBytes(enc.encode(a), enc.encode(b))

async function pbkdf2(secret: string, salt: Uint8Array<ArrayBuffer>, iterations: number, bytes: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, bytes * 8))
}

export async function hashPassword(password: string, iterations = PASSWORD_ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2_sha256$${iterations}$${b64url(salt)}$${b64url(await pbkdf2(password, salt, iterations, 32))}`
}

/** A hash no password matches, for spending the same time on unknown logins as on known ones. */
export const DUMMY_HASH = `pbkdf2_sha256$${PASSWORD_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split('$')
  const iterations = Number(iter)
  if (scheme !== 'pbkdf2_sha256' || !salt || !hash || !Number.isInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) return false
  const expected = unb64url(hash)
  return sameBytes(await pbkdf2(password, unb64url(salt), iterations, expected.length), expected)
}

export async function sha256hex(data: string | Uint8Array<ArrayBuffer>): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data))
  return Array.from(d, b => b.toString(16).padStart(2, '0')).join('')
}

/** A new session token (32 random bytes) for the cookie. */
export const newToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)))
