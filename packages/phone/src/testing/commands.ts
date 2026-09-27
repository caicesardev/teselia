import { defineBrowserCommand } from '@vitest/browser-playwright'

export interface EmulatedMedia {
  forcedColors?: 'active' | 'none'
  reducedMotion?: 'reduce' | 'no-preference'
  colorScheme?: 'light' | 'dark'
}

export const emulateMedia = defineBrowserCommand<[EmulatedMedia]>(async (context, media) => {
  await context.page.emulateMedia(media)
})
