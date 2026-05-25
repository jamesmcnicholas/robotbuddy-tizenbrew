# RobotBuddy TizenBrew Client

This directory is a standalone TizenBrew application module that launches the Buddy web UI on the same server origin, which avoids the cross-origin XHR path that older Samsung TV engines can mishandle.

## What It Does

- opens the Buddy thin-client face page on the server origin
- avoids cross-origin XHR from the TV module itself
- keeps the TV install/update flow inside TizenBrew

## Local Structure

- `package.json`
  - TizenBrew module manifest
- `app/index.html`
  - TV launcher shell
- `app/styles.css`
  - TV styling
- `app/app.js`
  - redirect logic

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
2. Let it redirect to the Buddy UI.
3. If the redirect does not happen, open `http://192.168.1.180:8787/face` directly in the TV browser.

Notes:

- The Buddy server now serves a dedicated `/face` page for thin clients.
- That same-origin page is the reliable place to do the live state polling on this TV.
