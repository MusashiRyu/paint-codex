/**
 * FNV-1a, 32-bit. Not a cryptographic hash — it exists so we can ask "is this
 * the same string as last time?" without keeping a 190 KB document around to
 * compare against.
 */
export function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    // hash * 16777619, kept in 32-bit range without overflowing to a float.
    hash = Math.imul(hash, 0x01000193);
  }
  // >>> 0 reads the result as unsigned; the shifts above leave it signed.
  return (hash >>> 0).toString(36);
}
