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

## Sherlock (Inlang) in VS Code

This repository is preconfigured for Sherlock with `project.inlang/settings.json`.

1. Install the extension: [inlang.vs-code-extension](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)
2. Open the repo in VS Code and open the `Sherlock` tab.
3. Use translation keys via `t()`, `useTranslations()`, or `getTranslations()` and Sherlock will show inline previews/editing backed by `messages/{locale}.json`.

If Sherlock does not load, ensure Node.js is v18+ and the workspace is opened as a Git repository.

## License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for more details.
