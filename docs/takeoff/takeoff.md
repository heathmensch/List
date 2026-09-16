# Takeoff

Takeoff is the frontend. It is a Next.js app that users hit in the browser. It talks to Pluto over HTTP.

Most day-to-day work happens under `src/`: pages and UI in `src/app/`, and helpers (like calling Pluto) in `src/lib/`.

```
apps/takeoff
  src/app/            Pages, layout, and global styles
  src/lib/            Helpers for talking to Pluto
  .env.local          Frontend env vars (not committed)
  .env.example        Copy this if you need a new .env.local
  next.config.ts      Next.js settings (empty for now)
  package.json        Scripts: dev, build, lint
```

You can ignore `node_modules/` and `.next/`. Those are installed or generated, not hand-edited.

---

---

## `src/app/`

This is the App Router. Files here become routes.

| Path          | Why you care                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`  | The shell around every page: HTML document, fonts, and site-wide metadata (title, description).                                                                                                          |
| `page.tsx`    | The home page (`/`). It asks Pluto if the API and database are up, then shows that status. New screens are more `page.tsx` files in new folders (for example `src/app/about/page.tsx` becomes `/about`). |
| `globals.css` | Global styles and Tailwind. Shared look-and-feel goes here.                                                                                                                                              |

Add a `public/` folder at the Takeoff root later if you need images, icons, or other static files.

---

---

## `src/lib/`

Shared TypeScript that is not a page.

| Path     | Why you care                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `api.ts` | Knows Pluto's URL and how to call `GET /health`. Put more Pluto client functions here as the API grows. |

---

---

## Files at this level you might still open

| File             | Why you care                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `.env.local`     | `NEXT_PUBLIC_API_URL` so the browser/server knows where Pluto is (`http://localhost:4000` locally). |
| `next.config.ts` | Next.js config. Leave it until you need a real setting.                                             |
| `package.json`   | Scripts for running Takeoff. Prefer the root `pnpm` commands in the main README.                    |
