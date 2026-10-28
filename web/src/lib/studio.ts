import { apiFetch } from './cloud'
import { parseStudioDraft, templateStudioDraft, type StudioInputs } from '../../../supabase/functions/_shared/studio'
export * from '../../../supabase/functions/_shared/studio'

export async function generateStudioDraft(input: StudioInputs, signal?: AbortSignal) {
  try {
    const response = await apiFetch('/api/studio/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input }), signal })
    if (!response.ok) throw new Error('STUDIO_UNAVAILABLE')
    const payload = await response.json()
    const draft = parseStudioDraft(payload.draft, input)
    if (!draft) throw new Error('INVALID_STUDIO_DRAFT')
    return draft
  } catch (error) {
    if (signal?.aborted) throw error
    return templateStudioDraft(input)
  }
}
