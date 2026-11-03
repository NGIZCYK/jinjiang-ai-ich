/** Keep feature discovery independent of authentication and data stores. */
export const STAYS_LOCAL = import.meta.env.MODE === 'stays'
export const STAYS_ENABLED = STAYS_LOCAL || String(import.meta.env.VITE_ENABLE_STAYS).toLowerCase() === 'true'
export const STAY_VERSION = '2026.11.02-stays-v1'
