# Takeoff

Takeoff is the frontend. It is a Next.js app that users hit in the browser. It talks to Pluto over HTTP.

Most day-to-day work happens under `src/`: pages and UI in `src/app/`, shared UI in `src/components/`, and Pluto helpers in `src/lib/`.

```
apps/takeoff
  src/app/            Pages, layout, and global styles
  src/components/     Sidebar, Goals workspace, toasts
  src/lib/            Pluto client + folder tree helpers
  .env.local          Frontend env vars (not committed)
  .env.example        Copy this if you need a new .env.local
  next.config.ts      Next.js settings
  package.json        Scripts: dev, build, lint
```

You can ignore `node_modules/` and `.next/`. Those are installed or generated, not hand-edited.

---

## `src/app/`

| Path              | Why you care |
| ----------------- | ------------ |
| `layout.tsx`      | App shell: fonts, metadata, left Sidebar, main column. |
| `page.tsx`        | Goals (`/`) — mounts `GoalsWorkspace`. |
| `today/page.tsx`  | Today (`/today`) — header only for now. |
| `globals.css`     | Brand colors (`--brand`, `--sidebar`, etc.) and Tailwind. |

---

## `src/components/`

| Path | Why you care |
| ---- | ------------ |
| `Sidebar.tsx` | Nav: Goals + Today. |
| `Toast.tsx` | Error/success toasts (e.g. “delete tasks before adding a goal layer”). |
| `goals/GoalsWorkspace.tsx` | Loads `/me` + folders/tasks; tree, context menu, detail panel. |
| `goals/FolderTree.tsx` | Nested colored folder list. |
| `goals/FolderDetail.tsx` | Breadcrumbs + action steps for the selected folder. |
| `goals/FolderContextMenu.tsx` | Right-click menu. |
| `goals/NamePrompt.tsx` | Modal to name a new folder. |

---

## `src/lib/`

| Path | Why you care |
| ---- | ------------ |
| `api.ts` | All Pluto HTTP calls + shared `Folder` / `Task` types. Start here to see frontend↔backend linkage. |
| `folderTree.ts` | Builds a nested tree from Pluto’s flat `GET /folders` list. |

`NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) must point at Pluto.
