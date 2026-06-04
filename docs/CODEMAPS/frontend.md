<!-- Generated: 2026-06-03 | Scope: apps/web (Fase 0) | Token estimate: ~550 -->

# Frontend (apps/web — Next.js 15 App Router)

## Route tree

```
src/app/
  layout.tsx                 ROOT — owns <html>/<body>, loads tokens.css + globals.css
  globals.css                @tailwind + base (body/headings use token vars)
  (public)/                  SSR/SSG, SEO
    layout.tsx               header/footer shell
    page.tsx                 "/"          landing placeholder (Fase 5)
    [slug]/page.tsx          "/[slug]"    public profile, SSR (params is a Promise)
  (app)/                     logged-in area → PWA (Fase 6)
    layout.tsx               app shell
    dashboard/page.tsx       "/dashboard" type-safety POC (shared userSchema.parse)
  lib/config.ts              env-driven { apiUrl, brand } (NEXT_PUBLIC_*)
```

Route groups `(public)`/`(app)` don't affect the URL. Only ROOT layout renders html/body.

## Next 15 gotchas

- `params` / `searchParams` are **Promises** in async Server Components — `await` them.
- Automatic JSX runtime (no React import). Server Components by default.

## State (planned, plan §6.2)

server state → TanStack Query · client → Zustand · search filters → URL. (Not wired in Fase 0.)

## Styling

Tailwind preset from `@obracerta/config/tailwind` (presets[]) + token CSS vars from
`@obracerta/design-tokens/tokens.css`. `tailwind.config.ts` content includes
`../../packages/ui/src/**` so Design System classes are generated.

## Design System

`@obracerta/ui` → `Button` (variants primary/secondary/ghost; sizes sm/md/lg; React 19 ref-as-prop), `cn()` util.

## Type-safety POC

`(app)/dashboard/page.tsx` validates a fixture with `userSchema` from `@obracerta/shared` —
same schema the API uses. Demonstrates front↔back contract sharing.

## Source mockups

Approved HTML prototypes live in `docs/mockups/` (landing_page, prototipo, prototipo2,
apresentacao, carta_intencoes). Landing (Fase 5) and the public profile derive from them.
