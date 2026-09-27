import type { EmulatedMedia } from './commands'

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia: (media: EmulatedMedia) => Promise<void>
  }
}
