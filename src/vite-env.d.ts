/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    board: Record<string, unknown>
    resistor: Record<string, unknown>
    led: Record<string, unknown>
    pinheader: Record<string, unknown>
    trace: Record<string, unknown>
  }
}
