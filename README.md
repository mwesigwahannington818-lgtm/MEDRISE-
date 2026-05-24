# MedRise Medical Centre

## Local development

This workspace uses `pnpm` and a pnpm workspace with multiple packages.

### Start the main website

From the repo root:

```powershell
pnpm install
pnpm run dev
```

That will start the `artifacts/medrise` app on:

- `http://localhost:4173/`

### Alternative start commands

Run the site directly from the app folder:

```powershell
cd "C:\Users\ADMIN\Downloads\MEDRISE MEDICAL CENTRE OFFICIAL ZIP FILE\artifacts\medrise"
pnpm install
pnpm run dev
```

Start the mockup sandbox instead:

```powershell
pnpm run dev:mockup-sandbox
```

### Environment variables

The `artifacts/medrise` app already includes a `.env` file with:

```text
PORT=4173
BASE_PATH=/
```

### Useful scripts

- `pnpm run dev` — start the main MedRise website
- `pnpm run start` — alias for the main website
- `pnpm run dev:medrise` — start the main website explicitly
- `pnpm run dev:mockup-sandbox` — start the mockup sandbox

### Quick start helpers

You can also launch the site with one file:

- `start.ps1` — PowerShell helper
- `start.bat` — Windows batch helper

### Notes

- If the dev server is already running, keep the terminal open.
- If you need to stop it, press `Ctrl+C` in the terminal.
- The website should be available at `http://localhost:4173/` once started.
