/** Connectivity failures and missing metadata are not proof of an old server. */
export function isKnownVersionMismatch(capabilities: { stale: boolean; apiVersion: string } | null): boolean {
  return Boolean(capabilities?.stale && !['unavailable', 'unknown', ''].includes(capabilities.apiVersion))
}
