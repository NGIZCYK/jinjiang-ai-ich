import { resolve } from 'node:path'
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { AvatarStage } from '../src/components/avatar/AvatarStage'
import { WANNIANG_PORTRAIT } from '../src/components/avatar/avatarPortrait'
import type { AvatarState } from '../src/components/avatar/avatarTypes'
let style:HTMLStyleElement
beforeEach(()=>{style=document.createElement('style');style.textContent=readFileSync(resolve(process.cwd(),'src/styles/avatar.css'),'utf8');document.head.append(style)})
afterEach(()=>{cleanup();style.remove()})
describe('one stable bilingual portrait',()=>{
 it('keeps the same image element and source throughout all language and playback state changes',()=>{
  const view=render(createElement(AvatarStage,{state:'idle',language:'zh'}));const portrait=screen.getByRole('img')
  fireEvent.load(portrait)
  for(const language of ['zh','en'] as const)for(const state of ['idle','listening','thinking','speaking','paused','error'] as AvatarState[]){
   view.rerender(createElement(AvatarStage,{state,language,gesture:'introduce',mouthOpen:.9}))
   expect(screen.getByRole('img')).toBe(portrait);expect(portrait.getAttribute('src')).toBe(WANNIANG_PORTRAIT)
   expect(view.container.querySelector('.puppet-avatar')).toBeNull()
   expect(view.container.querySelector('[data-motion="still"]')).not.toBeNull()
   expect(getComputedStyle(portrait).transform).toBe('none')
   expect(getComputedStyle(portrait).animation).toBe('none')
  }
 })
 it('falls back to a neutral placeholder instead of a different face when loading fails',()=>{
  render(createElement(AvatarStage,{state:'speaking',language:'en',name:'Wanniang'}));fireEvent.error(screen.getByRole('img'))
  expect(screen.queryByRole('img')).toBeNull();expect(screen.getByText('Wanniang')).toBeTruthy()
 })
})
