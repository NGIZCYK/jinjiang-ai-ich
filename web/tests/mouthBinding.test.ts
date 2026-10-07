import { expect, it, vi } from 'vitest'
import { bindMouth } from '../src/components/avatar/mouthBinding'
it('applies each speech frame directly, clamps values and releases to rest', () => {
  const element={style:{setProperty:vi.fn()}},unsubscribe=vi.fn()
  let publish: (open:number, form:number) => void = () => {}
  const cleanup=bindMouth(element,{subscribe(listener){publish=listener;return unsubscribe}})
  publish(.3333,0);expect(element.style.setProperty).toHaveBeenLastCalledWith('--jaw-open','0.333')
  publish(3,0);expect(element.style.setProperty).toHaveBeenLastCalledWith('--jaw-open','1.000')
  publish(Number.NaN,0);expect(element.style.setProperty).toHaveBeenLastCalledWith('--jaw-open','0.000')
  cleanup();expect(unsubscribe).toHaveBeenCalledOnce();expect(element.style.setProperty).toHaveBeenLastCalledWith('--jaw-open','0.000')
})
