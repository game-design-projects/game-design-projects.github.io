# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-09-30

### Added
- Custom "printed catalogue" design: editorial type (Instrument Serif / Archivo / JetBrains Mono), single vermilion accent, dark + light themes, Plates / Index views, search, language filters and sorting.
- Procedurally generated screen-print cover art per repo (deterministic from the repo name).
- `scripts/build-data.sh` and a scheduled (every 6 h) workflow that snapshot the public repo list to `data/repos.json` as a rate-limit fallback.

### Changed
- Replaced the GitProfile-based page with the custom static page; forks are now listed.

### Removed
- GitProfile / Vite / React toolchain, `package.json`, Dependabot config and the PR test workflow (nothing left to build).

## [1.0.0] - 2026-09-29

### Added
- Landing page for the `game-design-projects` GitHub org, based on [GitProfile](https://github.com/arifszn/gitprofile) (MIT).
- Repo list is fetched live from the GitHub API in the visitor's browser (public repos only, sorted by last update), so new/renamed/deleted repos appear without a redeploy.
- GitHub Actions workflow deploying to GitHub Pages on push to `main`.

### Changed
- Config trimmed to an org showcase: no skills/experience/resume/blog sections, `synthwave` default theme, org avatar as favicon/icons, PWA disabled.
