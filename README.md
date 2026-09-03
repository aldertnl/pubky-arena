[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/pubky/pubky-app)

# Pubky web app

## Prerequisites

- Node.js (see [.nvmrc](./.nvmrc) for the recommended version)

## Getting Started

First, install the dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Dependency install scripts

npm 11.16+ gates dependency lifecycle scripts (`preinstall` / `install` / `postinstall`) behind the `allowScripts` field in `package.json`; npm 11 only warns about unapproved scripts, npm 12 skips them. Only `cypress` needs its script (it downloads the Cypress binary), so it is approved there, pinned to the installed version. `sharp`, `@sentry/cli`, `unrs-resolver`, and `browser-tabs-lock` are denied: their prebuilt platform packages make those scripts no-ops. When bumping Cypress, run `npm install-scripts approve cypress` in the same change so the pin follows the new version, and use `npm install-scripts ls` to review anything new.

## Environment Variables

Copy the example environment file and adjust the values as needed:

```bash
cp .env.example .env
```

See [docs/environment.md](./docs/environment.md) for more details.

## Common Workflows

- Check architecture and coding conventions: [docs/README.md](./docs/README.md)
- Run local code review workflow (Cursor): use `/review` (defined in `.cursor/skills/code-review/SKILL.md`)
- Follow commit message format: [docs/commit-message.md](./docs/commit-message.md)

## License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for more details.
