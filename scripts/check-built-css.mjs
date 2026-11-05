import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(process.cwd(), 'dist')
const loweredColorScheme = '--lightningcss-'

const offenders = readdirSync(distDir)
  .filter((file) => file.endsWith('.js'))
  .filter((file) => readFileSync(join(distDir, file), 'utf8').includes(loweredColorScheme))

if (offenders.length > 0) {
  console.error(
    `light-dark() was lowered to ${loweredColorScheme}* variables in ${offenders.join(', ')}. ` +
      'Those variables only exist under a color-scheme declaration, so every color would be invalid. ' +
      'Check build.cssTarget in vite.config.ts.',
  )
  process.exit(1)
}
