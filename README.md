# game-design-projects.github.io

Landing page for the [game-design-projects](https://github.com/game-design-projects) GitHub org → **https://game-design-projects.github.io/**

Built on the open-source [GitProfile](https://github.com/arifszn/gitprofile) (MIT). The repo list is pulled **live** from the GitHub API each time someone opens the page (public repos only, newest activity first), so there is nothing to maintain: create, rename or delete a repo and the page follows.

## Configure

Everything lives in [`gitprofile.config.ts`](./gitprofile.config.ts) — theme, sort order, `limit`, `exclude.projects` to hide specific repos. Push to `main` and the [Deploy workflow](./.github/workflows/deploy.yml) republishes.

## Develop

```bash
npm ci
npm run dev     # http://localhost:5173
npm run build   # type-check + production build into dist/
```

## Notes

- Visitors' browsers call the unauthenticated GitHub API (60 req/h per IP); on rate limit the page shows an error with the reset time.
- Licensed MIT, same as upstream (see [LICENSE](./LICENSE)).
