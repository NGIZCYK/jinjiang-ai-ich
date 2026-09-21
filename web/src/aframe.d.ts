import type { DOMAttributes } from 'react'

type AFrameProps = DOMAttributes<HTMLElement> & Record<string, unknown>

declare global {
  interface Window {
    AFRAME?: unknown
  }

  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameProps
      'a-assets': AFrameProps
      'a-sky': AFrameProps
      'a-plane': AFrameProps
      'a-box': AFrameProps
      'a-text': AFrameProps
      'a-sphere': AFrameProps
      'a-camera': AFrameProps
      'a-cylinder': AFrameProps
      'a-circle': AFrameProps
      'a-ring': AFrameProps
      'a-torus': AFrameProps
      'a-cone': AFrameProps
      'a-light': AFrameProps
      'a-entity': AFrameProps
      'a-image': AFrameProps
      'a-cursor': AFrameProps
      'a-animation': AFrameProps
    }
  }
}

export {}
