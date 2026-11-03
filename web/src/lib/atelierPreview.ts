/** Explicit preview mode never initialises a cloud client, even with local credentials. */
export const ATELIER_PREVIEW = import.meta.env.MODE === 'atelier-preview'
