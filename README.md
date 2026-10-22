# Little Notes

Little Notes is a small, private space for capturing thoughts. Create and edit notes, search their titles and text, pin important notes, and remove notes when you no longer need them.

The app is a browser-only React application. Notes are saved in the browser's `localStorage` on the current device; there is no account, server-side storage, or cloud sync. Clearing browser data or using another browser/device will not carry notes over.

## Features

- Create, edit, search, pin, and delete notes
- Browse all notes or only pinned notes
- Automatic local saving and word counts
- Keyboard shortcuts: `Ctrl`/`⌘` + `N` to create a note and `Ctrl`/`⌘` + `K` to search
- Responsive layout for desktop and mobile screens

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 10+

## Run locally

From the project root:

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Useful commands:

```sh
pnpm typecheck
pnpm build
pnpm preview
```

`pnpm preview` serves the production build locally after running `pnpm build`.

## Deploy to Vercel

Import the repository into Vercel and deploy with the repository root as the project root. The included `vercel.json` installs the app's dependencies, builds the `@workspace/notes` app, publishes `artifacts/notes/dist`, and serves the app entry point for routes. No environment variables or database are required.

You can also deploy from the Vercel CLI:

```sh
pnpm dlx vercel
```

## Project layout

- `artifacts/notes/` — Little Notes frontend, Vite configuration, and static assets
- `pnpm-workspace.yaml` — pnpm workspace and shared dependency configuration
- `vercel.json` — Vercel build and static hosting configuration

## Technology

- React and TypeScript
- Vite
- Tailwind CSS
- Browser `localStorage`
