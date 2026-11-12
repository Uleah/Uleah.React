# Releasing

`@uleah/react` follows [semantic versioning](https://semver.org/). Before 1.0.0, a minor version
may contain breaking changes.

There are two release paths:

1. **First release (0.1.0): manual**, from a maintainer's computer. npm can only attach a
   trusted publisher to a package that already exists.
2. **Every later release: automated** by `.github/workflows/publish.yml` through npm Trusted
   Publishing (OIDC). No npm token is stored anywhere.

## 1. First release (manual)

Run these from a clean, up-to-date `main` checkout.

```bash
git switch main && git pull --ff-only
git status                       # must be clean
node --version                   # >= 20.19 (22 or 24 recommended)
npm --version                    # >= 10
corepack enable
pnpm install --frozen-lockfile
pnpm format:check && pnpm build && pnpm typecheck && pnpm lint && pnpm test && pnpm verify:package
npm pack --dry-run               # review the file list (dist/, README, CHANGELOG, LICENSE, package.json)
```

Authenticate interactively. This opens a browser, and only you type your password or 2FA code:

```bash
npm login
npm whoami                       # must print the account that owns the @uleah scope
npm org ls uleah                 # if @uleah is an npm organization: you must be listed (owner/admin)
```

Publish:

```bash
npm publish --access public      # npm asks for a 2FA code or browser confirmation
```

Verify:

```bash
npm view @uleah/react version    # 0.1.0
npm view @uleah/react dist-tags  # latest: 0.1.0
```

Tag the release so the history matches npm. Do this **after** configuring the trusted publisher
(step 2), or delete the run: pushing `v0.1.0` triggers `publish.yml`, which will fail harmlessly
because 0.1.0 already exists.

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

## 2. One-time setup for automated releases

On **npmjs.com**, open package `@uleah/react` → **Settings** → **Trusted Publisher** →
**GitHub Actions**, and enter:

| Field                | Value         |
| -------------------- | ------------- |
| Organization or user | `Uleah`       |
| Repository           | `Uleah.React` |
| Workflow filename    | `publish.yml` |
| Environment          | `npm`         |

Then, under **Publishing access**, choose _Require two-factor authentication and disallow tokens_,
so the trusted publisher (or an interactive login with 2FA) is the only way to publish.

On **GitHub**, open **Settings → Environments → `npm`**. The environment is created on the first
run, or you can create it beforehand. Optionally:

- add **required reviewers**, so each release waits for manual approval;
- restrict **deployment tags** to `v*`.

## 3. Automated releases (0.1.1 and later)

```bash
git switch main && git pull --ff-only
# bump the version in package.json (e.g. 0.1.1) and update CHANGELOG.md, via a pull request
npm version 0.1.1 --no-git-tag-version   # or edit package.json by hand
```

After that PR is merged into `main`:

```bash
git switch main && git pull --ff-only
git tag -a v0.1.1 -m "v0.1.1"
git push origin v0.1.1
```

The workflow then:

1. checks that the tag (`v0.1.1`) matches `package.json` (`0.1.1`) and that the tagged commit is on
   `main`;
2. installs with `pnpm install --frozen-lockfile`;
3. runs format check, build, typecheck, lint, tests and `verify:package`;
4. publishes with `npm publish --access public`, authenticated through OIDC. Provenance is
   attached automatically.

If any step fails, nothing is published. Fix the problem, delete the tag
(`git push origin :refs/tags/v0.1.1`), and tag again.
