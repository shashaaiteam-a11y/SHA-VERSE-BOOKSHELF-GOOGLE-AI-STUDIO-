# Step 1 — App-Level & Per-Module ErrorBoundary Protection

## Goal
Ek bhi module/route ka render error pura app blank kar de, ye hamesha ke liye band.
Har failure ab sirf uske apne area me dikhega — baaki app chalti rahegi.

## Dependency analysis (pehle ki gayi, per Safe Development rules)

| File | Purpose | Consumers (kaun affect hoga) | Side-effect risk |
|---|---|---|---|
| `src/main.tsx` | App entry | Poora app | Root boundary sirf add hota hai; render order unchanged |
| `src/App.tsx` | Router + provider stack | All 40+ routes | Sirf `withSuspense` ke andar ek wrapper; routes/guards untouched |
| `src/components/KeepAliveModules.tsx` | 6-module keep-alive shell | Home, Movion, NovaChat, Bookshelf, Groups, Profile | Boundary layer div ke andar; animation/visibility/inert logic untouched |

Koi database, hooks, global CSS, auth, ads, push ya native code change nahi hoga.
Naya component sirf existing design tokens use karega (`bg-background`,
`text-foreground`, `muted-foreground`, `primary`) — koi hardcoded color nahi.

## Design

### New file: `src/components/ErrorBoundary.tsx`
1. **`ErrorBoundary`** (React class component):
   - `getDerivedStateFromError` → error state; `componentDidCatch` → `console.error` with component stack (diagnosis ke liye).
   - Fallback card (mobile-first, 44px+ buttons): "Something went wrong" + context label (module/route ka naam) + **Try again** (reset) + **Reload app** (last resort).
   - Dark mode apne aap tokens se follow hoga.
2. **`RouteErrorBoundary`** (functional wrapper):
   - `useLocation()` se pathname ko boundary key banata hai → navigation par boundary apne aap reset (deep page → back → clean state).
   - Keep-alive module boundaries par key NAHI — wahan error tab tak dikhega jab tak user "Try again" na dabaye (module state preserve rakhne ke liye).

### Changes in 3 existing files (sirf wrapping, logic zero change)

1. **`src/components/KeepAliveModules.tsx`** — har module layer ke `Suspense` ke andar
   `<ErrorBoundary contextLabel="Home / Movion / NovaChat / Bookshelf / Groups / Profile">`.
   Chhupe hue module ka error contained rahega; dobara kholne par recovery card.
2. **`src/App.tsx`** — `withSuspense` ab `RouteErrorBoundary` ke andar Suspense rakhta hai
   (sab ~40 routes ek hi edit me covered). Auth/ProtectedRoute/admin guards waise hi rahenge.
3. **`src/main.tsx`** — `<App />` ko root-level `ErrorBoundary` me wrap (last resort safety net).

### Dev-only crash test route (verification ke liye)
`/__crash-test` route sirf `import.meta.env.DEV` me register hoga — render par
jaan-boojh kar error phenkta hai, taki containment ko real browser me verify kiya ja sake.
Production build me ye route exist hi nahi karega.

## Expected behaviour after implementation
- Movion me render error → sirf Movion ka recovery card; Home/Bookshelf/Groups sab chalu.
- Kisi deep page (reader, watch, post detail) me error → us page ka recovery card; back jao to app normal.
- Sabse bahar ka crash (e.g. provider level) → root fallback card + Reload button.
- ErrorBoundary sirf *render* crash rokta hai — DB ya shared-logic bugs ke liye Steps 2–9 abhi bhi chahiye.

## Verification checklist (implementation ke baad)
1. `npx tsgo --noEmit -p tsconfig.app.json` + `npm run build` — real exit codes.
2. Browser (Playwright):
   - `/` normal load; module switching (keep-alive animation) intact.
   - `/__crash-test` → recovery card dikhe, app ka baaki hissa zinda rahe; dusre routes (e.g. `/auth`, `/help`) khol kar confirm.
   - Dark mode me fallback card ke colors check.
3. Report: jo test device-dependent hai wo "NOT TESTED" likha jayega (is step me koi native path involve nahi hai).

## Out of scope (baad ke approved steps)
GlobalRefresh fixes, hook consolidation, omnihub deletion, Movion data decision, ads clipping, realtime suffixes, query hardening.
