# Changesets

Each file in this folder describes a pending release: which packages change and with which semver bump (`patch`, `minor`, `major`), plus a short summary that ends up in the package's `CHANGELOG.md`.

- Add one with `pnpm changeset` in any pull request that changes a published package.
- `pnpm version-packages` consumes them, bumps versions and writes changelogs.
- `pnpm release` builds and publishes to npm (maintainer only).

Every package is versioned independently. Private packages (the docs site) are never versioned or published.
