import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const packageDir = process.cwd()
const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
const installable = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})])

const importSpecifiers = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g
const packageName = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')

function declarationFile(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier)
  return [`${base}.d.ts`, join(base, 'index.d.ts'), base.replace(/\.js$/, '.d.ts'), base].find(
    (candidate) => candidate.endsWith('.d.ts') && existsSync(candidate),
  )
}

const entry = resolve(packageDir, manifest.types)
const pending = [entry]
const visited = new Set()
const problems = []

while (pending.length > 0) {
  const file = pending.pop()
  if (visited.has(file)) continue
  visited.add(file)

  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(importSpecifiers)) {
    if (specifier.startsWith('.')) {
      const target = declarationFile(file, specifier)
      if (target) pending.push(target)
      else problems.push(`${file}: cannot find declarations for '${specifier}'`)
    } else if (!installable.has(packageName(specifier))) {
      problems.push(`${file}: imports '${specifier}', which consumers of ${manifest.name} cannot install`)
    }
  }
}

if (problems.length > 0) {
  console.error(`Public type declarations of ${manifest.name} are broken:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`Public type declarations of ${manifest.name}: ${visited.size} files, all imports installable.`)
