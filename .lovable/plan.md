# PROMAT "Tender OS" — Total Visual Redesign

## Scope in one line
Rebuild the presentation layer of every screen to an award-grade "Industrial Aurora" system — light-first, glassmorphic, animated — **without changing a single behaviour, route, data value or French string**. Four small additions are allowed (login, profile/preferences, presentational modals for currently inert buttons, ⌘K palette).

## What changes
- **Design tokens & typography** (`src/styles.css`): full light + dark token sets (Industrial Aurora palette), Inter Tight + Space Grotesk + JetBrains Mono, new radii/shadows, `::selection`, custom scrollbars.
- **Brand assets**: download official Promat logo → `public/promat-logo.png`; wire the three official favicons + `theme-color` in `src/routes/__root.tsx` head. Remove the red "P" placeholder.
- **Animated background layer**: fixed `pointer-events-none` component with aurora blobs, engineering grid, constellation canvas (≥1024px only, `visibilitychange`-paused), grain, cursor spotlight. Full `prefers-reduced-motion` fallback.
- **App shell** (`src/components/promat/shell.tsx`): sidebar becomes the 01→07 progress rail with red-filled/checkmarked completed nodes, pulsing active halo, gated future nodes, glass user footer card, collapsible to 64px, mobile drawer. Top bar: search with `⌘K` badge, notification bell (grouped by the 4 agent notification types), theme toggle (persisted `localStorage`, respects `prefers-color-scheme` first visit), user chip → dropdown to Profil/Préférences/Déconnexion.
- **Page anatomy**: breadcrumb → eyebrow → gradient title → subtitle → context strip → toolbar → content → sticky action bar. Applied uniformly.
- **Core component restyle** (buttons, pills, cards, inputs, toggles, sliders, tables, modals, toasts, skeletons, empty states) — all glass, tokens only, motion-consistent, both themes complete.
- **Tabs system**: exactly 3 canonical variants (pill / underline / segmented) applied to every existing tab/filter set. Progressive gating on chiffrage sub-tabs preserved.
- **List pages** (`/`, `/analyses`, `/articles`, `/consultations`, `/comparatifs`, `/chiffrages`, `/offres`, `/referentiels/*`, `/admin/*`): new toolbars (§5.7), per-list metric restyled, no data added.
- **6 dossier detail views**: shared shell with sticky right summary rail on ≥1280px + sticky bottom action bar. Progressive disclosure re-order (decision → evidence → data). No content added.
- **Forms**: unified two-column architecture, sticky section nav on long forms, floating labels, custom controls, sticky footer, spinner→check feedback. Applied to search-save, fournisseur, article, utilisateur, imports, both agent configs.
- **404** restyled (English strings kept — flag to user).

## Additions (§13, exactly four)
1. **`/login`** split-screen with pre-filled `houda@promat.ma / promat2026`, 6 demo chips, "Continuer sans se connecter". Session in `localStorage`; existing Déconnexion clears it.
2. **`/profil` + `/preferences`** — read-only over existing user record; preferences local-only.
3. **Presentational modal shells** for the currently inert buttons (Ajouter fournisseur/article/utilisateur, Enregistrer la recherche, Import wizards, Modifier/Désactiver/Réinitialiser confirms). No API, no validation invented.
4. **⌘K command palette** — navigates existing routes + theme toggle only.

## What does NOT change
- Every French label, placeholder, status, helper, verbatim.
- Every route, prop, handler, gating rule, data value (5 searches, 8 opportunities, 4 dossiers, 12 article lines, 5 suppliers, 4 référentiel articles, 7 documents, 6 users, 12 chiffrage rows, 12 offer rows, both agent configs, 7×13 permission matrix).
- Sidebar module list and order.

## Technical notes
- Framer Motion already presumed available; add if missing.
- Aurora background as a single fixed component mounted in `__root.tsx` under the outlet, `z-0`, `aria-hidden`.
- Theme via `class="dark"` on `<html>`, toggle helper in a small `theme.ts`; tokens in `src/styles.css` under `:root` / `.dark`.
- Auth guard: a thin `beforeLoad` check on `__root` (or a `_authenticated` wrapper) reading `localStorage`; on miss `redirect('/login')`. Preserves all existing routes.
- No backend, no Lovable Cloud enablement.

## Delivery order (matches §16)
Tokens → primitives → background → login+guard → shell → components → list pages → detail views → forms → profile/preferences/palette/404 → responsive/reduced-motion/contrast pass.

## Risk / scope note
This brief is very large (~15 routes, ~40 components, 2 themes, animated background, 4 additions). I'll ship it in one plan but expect to iterate section-by-section after the first pass — I'll prioritise the shell, tokens, background, login and the 6 detail views first so the "wow" is visible, then sweep the remaining référentiel/admin pages and forms.
