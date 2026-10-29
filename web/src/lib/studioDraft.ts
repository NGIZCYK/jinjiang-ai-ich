import { parseStudioInputs, type StudioInputs } from './studio'
import { safeSessionStorage } from './guideSignalStorage'

export interface StudioWorkspaceDraft {
  inputs: StudioInputs; context: StudioInputs|null; title: string; body: string;
  notes: string; checks: boolean[]; provider: 'deepseek'|'template'|'saved'; stale: boolean;
}
const key = (owner: string) => `jj_studio_draft_v1:${owner}`
export function readStudioDraft(owner: string): StudioWorkspaceDraft|null {
  try {
    const value = JSON.parse(safeSessionStorage()?.getItem(key(owner))??'null')
    if (!value || !parseStudioInputs(value.inputs) || (value.context !== null && !parseStudioInputs(value.context))
      || typeof value.body !== 'string' || value.body.length>28000 || typeof value.title !== 'string' || value.title.length>200
      || typeof value.notes !== 'string' || value.notes.length>1500 || !['deepseek','template','saved'].includes(value.provider)
      || !Array.isArray(value.checks) || value.checks.length!==3 || !value.checks.every((x:unknown)=>typeof x==='boolean') || typeof value.stale !== 'boolean') return null
    return value
  } catch { return null }
}
export function writeStudioDraft(owner: string, draft: StudioWorkspaceDraft) {
  try { const storage=safeSessionStorage();if(!storage)return false;storage.setItem(key(owner),JSON.stringify(draft));return true } catch { return false }
}
export function removeStudioDraft(owner: string) { try { safeSessionStorage()?.removeItem(key(owner)) } catch { /* Optional local draft. */ } }
