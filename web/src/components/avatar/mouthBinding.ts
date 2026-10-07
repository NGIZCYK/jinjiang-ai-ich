import type { MouthSource } from './avatarTypes'
/** Owns one DOM subscription; stopping/unmounting always returns the jaw to rest. */
export function bindMouth(element: { style: { setProperty(name: string, value: string): void } }, source: MouthSource) {
  const apply = (open: number) => element.style.setProperty('--jaw-open', Math.max(0, Math.min(1, Number.isFinite(open) ? open : 0)).toFixed(3))
  apply(0)
  const unsubscribe = source.subscribe(apply)
  return () => { unsubscribe(); apply(0) }
}
