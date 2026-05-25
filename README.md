# RobotBuddy TizenBrew Client

This directory is a standalone TizenBrew application module that mirrors the current `robotbuddy` face on a Samsung TV.

## What It Does

- renders the current Buddy face full-screen
- shows source, priority, mode, and print progress
- connects to the Buddy server over local HTTP
- uses `EventSource` when no read token is configured
- falls back to polling when a read token is configured

## Local Structure

- `package.json`
  - TizenBrew module manifest
- `app/index.html`
  - TV app shell
- `app/styles.css`
  - TV styling
- `app/app.js`
  - connection logic and face renderer

## Install Shape

Do not point TizenBrew at the root `robotbuddy` repo. Mirror the contents of this directory into a small public GitHub repo instead.

The public repo should contain these files at its root:

- `package.json`
- `README.md`
- `app/`

Example repo layout:

```text
robotbuddy-tizenbrew/
  package.json
  README.md
  app/
    index.html
    styles.css
    app.js
```

Then add that public GitHub repo from TizenBrew.

## Export Workflow

From the main `robotbuddy` repo:

```bash
npm run tizenbrew:export
```

That prepares a clean standalone copy at:

```text
.release/robotbuddy-tizenbrew/
```

You can also choose a custom target directory:

```bash
node scripts/export-tizenbrew-module.mjs /path/to/robotbuddy-tizenbrew
```

## First Publish

Example:

```bash
npm run tizenbrew:export
git clone git@github.com:<you>/robotbuddy-tizenbrew.git /tmp/robotbuddy-tizenbrew
cp -a .release/robotbuddy-tizenbrew/. /tmp/robotbuddy-tizenbrew/
git -C /tmp/robotbuddy-tizenbrew add .
git -C /tmp/robotbuddy-tizenbrew commit -m "Initial RobotBuddy TV module"
git -C /tmp/robotbuddy-tizenbrew push origin main
```

## Update Publish

When the TV client changes:

```bash
npm run tizenbrew:export
cp -a .release/robotbuddy-tizenbrew/. /tmp/robotbuddy-tizenbrew/
git -C /tmp/robotbuddy-tizenbrew add .
git -C /tmp/robotbuddy-tizenbrew commit -m "Update RobotBuddy TV module"
git -C /tmp/robotbuddy-tizenbrew push origin main
```

## TV Setup

1. Open the app on the TV.
2. Enter the Buddy server base URL, for example `http://192.168.1.50:8787`.
3. Add a read token only if your Buddy server requires one for `GET /api/state`.
4. Save.

Notes:

- The TV app expects the CORS change already added to `robotbuddy`.
- Live SSE updates are used only when no token is configured, because `EventSource` cannot attach an `Authorization` header.
- When a token is set, the app switches to polling automatically.
