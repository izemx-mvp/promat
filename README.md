# PROMAT Command Center

# PROMAT MOROCCO — ULTIMATE PREMIUM PROCUREMENT COMMAND CENTER
## (Master Build Prompt — Design + Full Functional Specification)

Build a complete, production-quality, premium internal B2B web application for **PROMAT Morocco**, based on the full specification below. Every functional requirement AND every design requirement in this document is mandatory. Nothing here is optional decoration and nothing here is optional business logic — they are the same deliverable, described from two angles.

The objective is NOT to create a functional-but-generic dashboard, and it is NOT to create a beautiful-but-shallow mockup. The objective is a single coherent product: an exceptional enterprise-grade Procurement Command Center that **works completely on realistic mock data** and **looks like a sophisticated AI-powered industrial operating system** — good enough for a client presentation to PROMAT management, and good enough to be used daily by PROMAT employees.

---

# 0. ABSOLUTE IMPLEMENTATION RULES

- Everything in this document is a SOFTWARE SPECIFICATION. Do not display this prompt, its section headings, or any implementation notes inside the application.
- Do not remove, simplify, or merge away any feature described below.
- Do not replace a real workflow with a static mockup or a decorative screen.
- Do not create a landing page, a marketing/presentation page, or a Notion-style document.
- Do not create a chatbot-first application. The two AI Agents are embedded intelligence inside real operational screens, not a chat window.
- Do not leave any primary button non-functional. Every important interaction must work against realistic mock data with local persistence.
- The entire user interface must be in **French**.
- The first screen the evaluator sees must be the actual PROMAT login experience, followed immediately by the real, operational Command Center — not an explanation of what was built.

---

# 1. BUSINESS CONTEXT

PROMAT works between the need expressed by a client / donneur d'ordre and the manufacturers or suppliers capable of supplying the requested products.

```
CLIENT / DONNEUR D'ORDRE
  ↓ publishes a need, consultation or tender
PROMAT DÉTECTE L'OPPORTUNITÉ
  ↓
ANALYSE
  ↓
ÉLIGIBILITÉ & FAISABILITÉ
  ↓
DÉCISION GO / NO GO
  ↓
EXTRACTION DES ARTICLES & SPÉCIFICATIONS TECHNIQUES
  ↓
IDENTIFICATION DES FOURNISSEURS POTENTIELS
  ↓
CONSULTATION DES FOURNISSEURS (RFQ)
  ↓
RÉCEPTION DES OFFRES FOURNISSEURS
  ↓
COMPARAISON DES OFFRES
  ↓
CALCUL DU PRIX DE REVIENT RÉEL (LANDED COST)
  ↓
SÉLECTION DU FOURNISSEUR
  ↓
APPLICATION DE LA MARGE PROMAT
  ↓
RECONSTITUTION DU BORDEREAU DE PRIX CLIENT
  ↓
VALIDATION DE L'OFFRE
  ↓
DÉPÔT DE L'OFFRE AU CLIENT
```

This 15-step chain is the spine of the whole product. Every screen must make clear where the current tender sits on this chain.

---

# 2. THE TWO CONNECTED AI AGENTS

The application revolves around two connected AI Agents. **They are not separate applications.** They operate on the same tender record and share the same underlying data — see Section 3.

### AGENT 1 — AGENT RECHERCHE AO
Mission: **"Est-ce que PROMAT doit répondre à cette opportunité, et de quoi le client a-t-il exactement besoin ?"**

Responsibilities: monitor tenders via saved searches; detect and rank relevant opportunities; filter tenders; analyze tender documents; extract administrative, technical, and financial/commercial requirements; calculate relevance score; analyze risk; verify PROMAT eligibility; prepare a GO/NO GO recommendation (never decide it); extract articles and structure technical specifications; match known PROMAT references; search supplier history; suggest potential suppliers; prepare RFQs; track supplier consultations; collect supplier quotations; hand off all collected data to Agent Chiffrage.

Visual language: analysis, document intelligence, opportunity detection, sourcing.

### AGENT 2 — AGENT CHIFFRAGE
Mission: **"Chez qui PROMAT doit acheter, combien cela coûtera réellement et à quel prix PROMAT doit vendre ?"**

Responsibilities: receive and normalize supplier quotations; compare offers on technical conformity, Genuine/OEM status, price, currency, delivery time, Incoterm, origin, and historical reliability; calculate customs duties; manage exchange rates; manage freight, transit, banking fees, and other approach costs; allocate costs; calculate landed cost; recommend a supplier (never decide it); allow manual supplier selection; calculate PROMAT margin; simulate margin scenarios; calculate final selling price; reconstruct the tender BPU/price schedule; run financial consistency controls; prepare the final client offer; track final approval.

Visual language: financial intelligence, cost calculation, supplier comparison, margin, pricing.

### AI DECISION PRINCIPLE (applies to both agents, everywhere)
AI may: recommend, extract, detect, compare, summarize, highlight risks, suggest next actions.
AI never silently decides: GO/NO GO, supplier selection, customs assumptions, margin, final price, or final offer submission. PROMAT (the human user) always validates these explicitly, through an explicit action with confirmation and an activity-log entry.

Do not depict the agents as cartoon robots. Use elegant, restrained AI indicators such as "Analyse terminée," "Recommandation disponible," "3 risques détectés," "Calcul mis à jour."

---

# 3. SHARED DATA PRINCIPLE

The two Agents work on the **same underlying entities**. Never duplicate: Tender, Client, Article, Supplier, Supplier Quotation, RFQ, Document, Costing, Final Offer.

Concretely:
- An article extracted by Agent Recherche AO is immediately available to supplier sourcing, RFQ creation, supplier quotations, Agent Chiffrage, and the final offer — with zero re-entry.
- A supplier quotation entered inside the supplier-consultation module must immediately appear inside Agent Chiffrage's comparison grid.
- A status change, price change, or supplier selection made in one module must be reflected everywhere that entity appears (table rows, workspace headers, KPI counts, Decision Rail) without a page refresh.

This is a functional requirement, not a data-modeling suggestion: implement it as one shared local data store (e.g. a single mock database module/context) that every screen reads and writes, with local persistence (localStorage/IndexedDB-equivalent for the environment) so changes survive navigation.

---

# 4. GLOBAL TENDER WORKFLOW (11 stages)

```
1. Détection  →  2. Analyse  →  3. GO / NO GO  →  4. Articles & besoins  →
5. Sourcing fournisseurs  →  6. Consultations  →  7. Offres fournisseurs  →
8. Chiffrage  →  9. Validation  →  10. Dépôt  →  11. Résultat
```

Every tender workspace displays this as an **interactive progress timeline** at the top: completed stages show a check, the current stage is visually highlighted, future stages are muted, and completed/current stages are clickable for navigation.

---

# 5. VISUAL & BRAND IDENTITY

## 5.0 Source of truth — use PROMAT's real brand assets, not invented ones
PROMAT's actual corporate website is **https://promat.co/fr/qui-sommes-nous/** (French site, company "PROMAT Maroc BTP"). Do not invent a new brand identity from scratch — pull the real assets and real colors from this site and use them as the foundation of everything in Section 5:

- **Logo (use this exact file):** `https://promat.co/wp-content/uploads/2018/01/logo.png` — a two-tone PNG (transparent background, ~910×533px) combining deep navy and PROMAT red. Use this same logo asset across login, entry animation, sidebar, and empty states, exactly as specified in Section 6.1 of the original brief.
- **Favicon (use these exact files):** `https://promat.co/wp-content/uploads/2018/01/cropped-favicon-32x32.png`, `cropped-favicon-192x192.png`, and `cropped-favicon-180x180.png` (apple-touch-icon). Configure these as the app's actual favicon/touch-icon metadata — do not generate a new icon.
- **Verified brand colors, extracted directly from promat.co's own stylesheet and logo file** (use these as the literal hex values for the palette in Section 5.3 — do not substitute a generic blue/graphite SaaS palette):
  - **PROMAT Red (primary accent):** `#E50D2D` — the dominant brand color on promat.co (used in the logo, headings, and CTAs).
  - **PROMAT Navy (primary dark / graphite substitute):** `#1D2A4D` — used as the header/navigation background on promat.co and as the second logo color. Use this navy (not a generic charcoal) as the app's deep graphite tone throughout the sidebar, dark surfaces, and dark-mode base.
  - **Light blue accent:** `#D7E8FF` and `#0086FF` — supporting/secondary accent, useful for info states, links, and subtle highlights.
  - **Neutral light surfaces:** `#E6EDF7` / `#E7EDF6` (very light blue-tinted off-white — use for the light-mode background instead of a plain warm off-white), plus grays `#CCCCCC`, `#ABACAE`, `#64676A` for borders, muted text, and dividers.
  - Keep the semantic green/amber/red status colors distinct from PROMAT Red so a "critical margin" badge never gets confused with the brand's own primary color — use a separate, slightly different red/amber/green for statuses (Section 5.3).

If the live site becomes unreachable while building, treat the hex values above as fixed and correct — they were sampled directly from promat.co's production CSS and logo asset, not estimated.

## 5.1 Visual objective
The interface must immediately communicate industrial intelligence, procurement expertise, engineering precision, AI-assisted decision-making, financial control, and enterprise maturity. Reference feeling (do not copy any real product): **Bloomberg Terminal × modern enterprise SaaS × industrial engineering control room × premium AI workspace.** The result must read as its own strong PROMAT identity built on PROMAT's real red/navy branding (Section 5.0) — premium, cinematic, intelligent, precise, elegant, fast, and visually memorable. Avoid the generic "AI SaaS dashboard" look, and avoid cyberpunk, neon, gaming visuals, or excessive glow.

## 5.2 Branding
Use the exact PROMAT logo file and favicon files from Section 5.0 on: the login screen, the loading/entry transition, the sidebar, the browser favicon (actually configured in app metadata, not a placeholder), relevant empty states, and authentication screens. Do not place a large redundant text label beside the logo if the logo already contains the brand name. Do not redraw, recolor, or reinterpret the logo — use the real asset as-is (on a background that gives it enough contrast, since it is a transparent PNG).

## 5.3 Color system
Build the enterprise palette directly on PROMAT's real identity from Section 5.0: PROMAT Navy (`#1D2A4D`) as the deep graphite/dark base, the light blue-tinted neutrals (`#E6EDF7`, white) as the warm/light surfaces, PROMAT Red (`#E50D2D`) as the primary accent, the light blue (`#0086FF` / `#D7E8FF`) as the sophisticated secondary accent, the grays (`#CCCCCC`, `#ABACAE`, `#64676A`) for borders and muted text, and dedicated semantic green/amber/red tokens for status (kept visually distinct from PROMAT Red itself, per Section 5.0). All combinations must meet strong contrast/accessibility standards, including PROMAT Red on both light and dark surfaces. Avoid glass/blur effects except where they genuinely improve legibility (e.g. a fixed header).

## 5.4 Animated background system
No boring static background anywhere in the app. Build a subtle, sophisticated animated system inspired by industrial networks, procurement flows, engineering diagrams, logistics routes, digital supply chains, and geographic sourcing connections — using techniques such as a very subtle moving grid, slow particles, fine connecting lines, soft ambient light fields, flowing route lines, and gentle parallax depth. It must stay premium and subtle, never flashy or distracting, and must never compromise content readability. Different application areas (login, Command Center, Agent Chiffrage screens, etc.) may carry slightly different atmospheres while preserving one visual identity.

## 5.5 Dark / light mode
Implement a complete, intentionally designed theme system, not a simple color inversion.
- **Light:** warm off-white background, white surfaces, sophisticated restrained shadows, high readability.
- **Dark:** deep charcoal/graphite with carefully layered surface elevations, visible borders, correct text contrast, accent colors that still read as PROMAT, and the same subtle ambient background animation adapted for dark. Never "everything black."

## 5.6 Imagery
Use professional, consistent industrial photography (equipment, cranes, hydraulic components, valves, flow meters, machinery, logistics, warehouses) in supplier profiles, article profiles, relevant document previews, selected empty states, and detail pages — placed purposefully, never as random stock-photo filler.

## 5.7 Typography & iconography
Use one modern enterprise typographic system with clear hierarchy between titles, section titles, financial figures, statuses, and metadata; financial numbers must be especially easy to scan (tabular figures, consistent alignment). Use one coherent professional icon library throughout — never mixed icon styles.

---

# 6. LOGIN & ENTRY EXPERIENCE

## 6.1 Cinematic login
Build a premium authentication screen: the real PROMAT logo (Section 5.0 — `https://promat.co/wp-content/uploads/2018/01/logo.png`), animated background (Section 5.4) built on PROMAT Navy/Red, a premium login card with email field, password field with show/hide toggle, "Se souvenir de moi," a "Se connecter" button with loading/validation/error states, and a smooth success transition.

**The form must already contain working, pre-filled demo credentials** (e.g. `yassine.elmansouri@promat.ma` / `Promat2026!`) so the evaluator can click "Se connecter" immediately without typing anything. Add a subtle "Mode démonstration" indicator. Authentication is mock but must actually gate entry to the app (i.e., a cleared credential field should show a validation state, not silently let you in).

## 6.2 Entry animation
After successful login: a short elegant loading transition → PROMAT logo with a subtle animation → transition into the app → the Command Center reveals progressively (staggered card/section entrance). Keep this short (roughly 1–2 seconds) and professional — never a long loading screen.

---

# 7. GLOBAL DESIGN SYSTEM

Every one of the following must be a custom-designed component, never default browser styling: buttons, inputs, selects, multi-selects, filter chips, dropdowns, tabs, cards, tables, badges, modals, drawers, tooltips, toasts, alerts, pagination, calendars/date pickers, sliders, toggles, checkboxes, radio buttons, breadcrumbs, progress indicators, timelines, empty states, loading/skeleton states, and confirmation dialogs.

**Buttons:** Primary buttons need strong hierarchy with subtle depth, elegant hover with a slight lift and shadow, plus active/disabled/loading states. Secondary buttons need refined borders and subtle hover backgrounds. Danger buttons must be clearly recognizable without being visually aggressive. Icon buttons need tooltips and accessible labels. Every consequential button must give full feedback on click — e.g. **Valider GO** → loading → confirmation → success animation → toast → status update on the record → activity-history entry → next workflow stage unlocked. Never leave a button changing visually with no functional effect.

**Forms:** clear labels, helpful placeholders, required-field indicators, inline validation, error and success states, contextual help, full keyboard navigation, appropriate input types, realistic defaults, save/loading states, and unsaved-change warnings where relevant. Long forms are organized with tabs, accordions, progressive disclosure, or grouped sections — never one giant form.

**Filters (every large data page):** search, dropdown filters, multi-select, date range, numeric range, status, responsible person, category, score — rendered as a professional filter bar. Active filters appear as removable chips (e.g. `Score > 80% ×`, `Échéance < 7 jours ×`). Provide **Réinitialiser** and **Enregistrer la vue**. Changing filters updates the mock data instantly with a smooth transition.

**Tables:** sticky header, sticky key column(s), row hover, subtle separators, compact-but-readable density, status badges, score indicators, inline actions, expandable rows, pagination, selectable rows with bulk actions, sortable/aligned columns, and a clear click interaction on each row (never a dead row, never a raw default table).

**Data visualization:** only where it answers a real business question — mini trend charts, progress indicators, score rings, horizontal comparison bars, margin visualizations, workflow progress. No decorative charts.

**Micro-interactions:** hover elevation, animated status changes, smooth page/tab/drawer/filter transitions, number count-up, progress animations, a success check animation, tooltip transitions, notification entrance — generally 150–400ms, always elegant, never gratuitous.

**Empty / loading / error / success states:** every state is explicitly designed — empty states get a relevant icon, concise explanation, and a primary action; loading uses skeletons and never freezes the UI; errors give a clear explanation and a recovery action; success gives an elegant confirmation.

**Accessibility:** strong contrast in both themes, visible focus states, full keyboard navigation, readable typography, adequate touch targets, semantic labels throughout.

---

# 8. APPLICATION LAYOUT

## 8.1 Sidebar (collapsible)
Top: PROMAT logo.

```
PILOTAGE
  Accueil
  Appels d'offres

AGENT RECHERCHE AO
  Recherches AO
  Analyses
  Articles & besoins
  Consultations fournisseurs

AGENT CHIFFRAGE
  Chiffrages
  Comparatifs fournisseurs
  Offres finales

RÉFÉRENTIELS
  Fournisseurs
  Articles
  Documents

ADMINISTRATION
  Historique
  Paramètres
```

Bottom: avatar, "Yassine El Mansouri," "Responsable Commercial," "Déconnexion."

## 8.2 Header (fixed)
Global search: "Rechercher un AO, un client, une référence, un fournisseur..." with grouped results (see Section 20). Quick actions: **+ Ajouter un AO**, **Nouvelle consultation**. Icons: Tâches, Alertes, Notifications. Profile menu.

## 8.3 Responsive behavior
Primary target 1440px+, with full support at 1366px and 1024px (tablet). Never allow clipped content, inaccessible buttons, overflowing cards, broken tables, or modal/drawer content cut off the viewport. Large tables scroll horizontally. The Decision Rail (Section 12) becomes a drawer on smaller screens. The sidebar collapses. All popups/drawers/modals must fit entirely within the viewport at every supported width.

---

# 9. COMMAND CENTER (Home)

Title: **Pilotage des appels d'offres** — Subtitle: **Suivez les opportunités, consultations fournisseurs et chiffrages en cours.**
Primary action: **+ Ajouter un appel d'offres** — Secondary: **Lancer une recherche AO**.

### KPI cards (compact, clickable, animated count-up on load)
- **AO à analyser** — 6 (2 prioritaires)
- **Décisions GO / NO GO** — 3 (à valider)
- **Réponses fournisseurs attendues** — 7 (3 en retard)
- **Chiffrages à valider** — 4 (2 prioritaires)

Clicking a card opens the corresponding filtered record list.

### Priorités du jour (task-oriented, interactive)
- **ONEE** — Décision GO / NO GO requise → **Décider**
- **OCP** — 2 fournisseurs sans réponse → **Relancer**
- **Marsa Maroc** — Nouvelle offre fournisseur reçue → **Comparer**
- **ONCF** — Marge sous le seuil recommandé → **Revoir le chiffrage**

### Dossiers prioritaires (table)
Columns: Référence, Client, Objet, Étape, Échéance, Responsable, Avancement, Priorité, Action. Use realistic Moroccan industrial clients: ONEE, OCP, Marsa Maroc, ONCF, ADM — with meaningful dates, amounts, scores, and statuses.

### Smart alert center
Alerts carry severity, icon, timestamp, action, and read/unread state. Examples:
- **Appel d'offres** — Nouvelle opportunité pertinente détectée.
- **Échéance** — Clôture dans 3 jours.
- **Fournisseur** — Aucune réponse reçue depuis 4 jours.
- **Chiffrage** — Nouveau devis fournisseur moins cher.
- **Marge** — Marge passée sous 15 %.
- **Document** — Fiche technique manquante.

---

# 10. AGENT RECHERCHE AO — FULL MODULE SPEC

## 10.1 Appels d'offres (list page)
Title/subtitle: "Appels d'offres" / "Centralisez, analysez et qualifiez les opportunités commerciales." Actions: **+ Ajouter un AO**, **Importer un dossier AO**.

**Status tabs** (with counts): Tous, Nouveaux, À analyser, À décider, GO, NO GO, En traitement, Déposés, Gagnés, Perdus.

**Filters:** recherche, client, famille produit, région, budget min/max, date de publication, date limite, score, responsable, statut. Saved views: "Mes AO prioritaires," "Score > 80 %," "Échéance < 7 jours," "À décider."

**Table columns:** Score, Référence, Client, Objet, Budget, Caution, Date limite, Étape, Responsable, Action. Score bands: 94% "Très pertinent," 78% "Pertinent," 42% "Faible." Row actions: Ouvrir, Analyser, Affecter, Archiver.

## 10.2 Recherches AO (saved-search configuration for what Agent Recherche AO monitors)
Table: Nom, Mots-clés, Familles, Clients, Région, Budget min., Budget max., Fréquence, Dernière analyse, Résultats, Statut, Actions.

**Create-search form** (sectioned, not one giant form): Nom (e.g. "Pièces de rechange – Levage"); Mots-clés (tag input — grue, levage, manutention, hydraulique, pompe, vérin, pièces de rechange, Potain, Grove, Terex, Demag); Mots-clés exclus (tag input); Type d'article/prestation (multi-select); Familles produits (Grues, Levage, Manutention, Hydraulique, Pièces de rechange, Mines, Portuaire, BTP, Coffrage, Équipements industriels); Clients ciblés (multi-select); Région; Budget min/max; Type AO (Fourniture, Installation, Maintenance, Équipement, Pièces); Fréquence (Manuel, Quotidien, Hebdomadaire). Buttons: **Tester la recherche** (shows realistic matching AO results), **Enregistrer**.

## 10.3 Tender workspace — `/appels-offres/:id` (dedicated route, never a popup)
**Header:** AO reference, client, status, responsible, priority.
**Summary strip:** Budget, Caution, Date limite, Lieu, Pertinence, Risque.
**Workflow timeline** (Section 4).

**Tabs:** Synthèse, Analyse, Éligibilité, Articles & besoins, Documents, Fournisseurs, Consultations, Chiffrage, Historique — all fully functional.

### Synthèse tab
"Recommandation Agent Recherche AO" (e.g. **GO recommandé**, score 86%, one-line rationale) plus compact counters: Articles détectés, Documents obligatoires, Fournisseurs potentiels, Point à vérifier.

### Decision Rail — Agent Recherche AO (sticky right panel; see Section 12)
"À faire" checklist (e.g. Vérifier référence technique, Confirmer CA, Valider GO/NO GO, Sélectionner fournisseurs, Lancer consultation), Prochaine échéance, Risque principal, Recommandation Agent, button **Voir l'analyse**.

### Analyse tab
- **Informations générales:** Client, Référence, Objet, Procédure, Publication, Date limite, Ouverture des plis, Budget, Caution, Financement, Lieu, Lots.
- **Conditions administratives** (checklist with statuses Disponible / À préparer / À vérifier / Manquant): Déclaration sur l'honneur, Acte d'engagement, Caution provisoire, CPS, Dossier administratif, Dossier technique, Dossier additif, Offre financière.
- **Exigences techniques** (structured): Produit, Norme, Dimensions, Pression, Marque éventuelle, Nature, Documentation, Certifications, Variantes autorisées/interdites.
- **Conditions commerciales:** devise, validité, délai, dépôt, paiement, livraison, Incoterms si définis.
- **Analyse des risques** (table: Risque, Niveau, Explication, Impact, Action) — e.g. Référence technique (Moyen), Délai fournisseur (Élevé), Caution (Faible), Document manquant (Moyen), Volatilité devise (Moyen).

### Éligibilité tab
Matrix — Critère | Exigence AO | PROMAT | Résultat | Justificatif | Action. Examples: Chiffre d'affaires (AO ≥ 1 000 000 MAD vs PROMAT 18 000 000 MAD → Conforme); Projet similaire (AO ≥ 1 référence vs PROMAT 2 références identifiées → Conforme, with "Voir références"); Caution (12 000 MAD, Préparable → Conforme). Statuses: Conforme, À vérifier, Non conforme, Document manquant. Header shows "Éligibilité globale : 88 %" and a recommendation line ("GO recommandé").

### GO / NO GO decision (prominent component)
Buttons **Valider GO** / **Classer NO GO**.
- If GO: fields Priorité, Responsable, Marge cible, Deadline interne sourcing, Commentaire → **Confirmer le GO**, which updates status, logs activity, unlocks sourcing, and creates follow-up tasks.
- If NO GO: require a reason (Non éligible, Délai insuffisant, Budget faible, Risque technique, Sourcing impossible, Rentabilité insuffisante, Hors stratégie, Autre) and a comment.

### Articles & besoins tab
Table: Ligne AO, Référence client, Désignation, Spécifications, Qté, Unité, Marque, Livraison, Sourcing, Conformité, Action.

**Article detail drawer** (side drawer, not a page):
- *Besoin client:* exact description, specifications, quantity, unit, requested manufacturer, technical requirements.
- *Données PROMAT:* internal reference, product family, known manufacturer reference, historic supplier, last price, previous tender.
- *Documents techniques:* datasheet, catalogue, certificate, manufacturer documentation.
- *Fournisseurs:* potential suppliers for this line.
- All AI-extracted values remain user-editable.
- **Historical article intelligence:** Dernier achat, Fournisseur précédent, Prix précédent, Devise, Date, Quantité, Variation nouvelle offre/historique (e.g. Dernier prix 4 050 EUR → Nouveau prix 4 500 EUR → Variation +11.1% → alert "Prix supérieur à l'historique").

### Documents tab / global Document Center
Categories:
- *Dossier AO:* Avis, RCDP, RCDG, CPS, CCTP, Bordereau.
- *Administratif:* Déclaration, Acte d'engagement, Caution, Attestations.
- *Technique:* Spécifications, Fiches techniques, Catalogues, Certificats.
- *Fournisseurs:* RFQ, Devis, Documentation fournisseur.

Table columns: Document, Type, Version, Source, Statut, Date, Responsable, Action. Use realistic file previews/icons, versions, statuses, metadata.

**Document analysis panel** (opens on selecting a document): Informations détectées, Exigences détectées, Dates détectées, Articles détectés, Alertes (e.g. "Signature requise," "Original demandé," "Variante interdite," "Documentation fabricant obligatoire"). User can validate/correct extracted values.

### Fournisseurs tab / Suppliers referential (full CRUD)
List table: Fournisseur, Pays, Marques, Familles, Genuine/OEM, Délai moyen, Dernier devis, Consultations, Commandes, Score, Statut, Action.

**Supplier profile page** — tabs: Informations, Contacts, Produits, Consultations, Devis, Historique prix, Commandes, Documents, Notes. Fields: company, country, city, website, email, telephone, brands, product families, currencies, Incoterms, payment terms, average delivery, rating. Include a company logo/avatar and relevant industrial imagery.

**Supplier recommendation card** (Agent Recherche AO), driven by product family, manufacturer, technical capability, prior quotations/purchases, response history, delivery performance — e.g. "CraneTech Germany," Match 94%, reasons (✓ Produit compatible, ✓ Marque disponible, ✓ Fournisseur déjà utilisé, ✓ Délai moyen 4 semaines, ✓ Bonne fiabilité), buttons **Sélectionner** / **Voir fournisseur**. AI recommends, PROMAT validates.

**Supplier performance metrics** (computed and shown on the profile): response rate, average response time, average delivery, pricing competitiveness, orders won, reliability score — reused by both agents for future recommendations.

### Consultations fournisseurs
Table: RFQ, AO, Fournisseur, Articles, Date, Réponse attendue, Statut, Relance, Action. Statuses: Brouillon, À envoyer, Envoyée, En attente, Relance nécessaire, Offre reçue, Refusée, Expirée.

**Create RFQ:** select supplier(s) and article(s); per line the supplier is expected to provide Brand, Manufacturer reference, Genuine/OEM, PU, Currency, Quantity, Delivery, Incoterm, Origin, Warranty, Validity, Documentation. Actions: **Enregistrer brouillon**, **Générer consultation**, **Marquer envoyée**.

**Supplier quotation entry** (**Ajouter une offre fournisseur**): header fields Fournisseur, Référence devis, Date, Validité, Devise, Incoterm, Origine, Conditions de paiement, Pièce jointe; line items Article, Référence proposée, Brand, PU, Quantity, Genuine/OEM, Lead time, Technical conformity. **Enregistrer l'offre** updates the RFQ, logs activity, updates supplier history, and makes the quotation immediately visible inside Agent Chiffrage — per the Shared Data Principle (Section 3).

---

# 11. AGENT CHIFFRAGE — FULL MODULE SPEC

## 11.1 Chiffrages (list page)
Title/subtitle: "Chiffrages" / "Comparez les offres fournisseurs et calculez les prix de vente PROMAT." Tabs: À préparer, En cours, À valider, Validés, Archivés.

Table columns: AO, Client, Articles, Fournisseurs, Coût achat, Frais, Prix de revient, Offre PROMAT, Marge, Statut, Responsable, Mise à jour, Action.

## 11.2 Chiffrage workspace — `/chiffrages/:id`
Header: "Chiffrage — [Référence AO]," workflow timeline (current stage "Chiffrage"), summary strip (Articles, Fournisseurs, Achats, Frais, PR, Vente, Marge).

**Tabs:** Comparatif fournisseurs, Frais d'approche, Douane & devises, Prix de revient, Marge & prix de vente, Bordereau AO, Contrôles, Versions.

### Comparatif fournisseurs
Large horizontal grid. Fixed columns: Ligne, Référence, Désignation, Qté, Spécifications. For **each** supplier, a grouped column set: PU, Devise, Total, Marque, Référence, Genuine/OEM, Délai, Incoterm, Origine, Conformité, Validité, Score. Final columns: Recommandation, Fournisseur retenu, Action.

**Recommendation logic** (must not be price-only): evaluate technical conformity, landed cost, delivery, Genuine/OEM, origin, Incoterm, historical reliability, supplier rating, quotation validity, commercial risk. Example card: "Fournisseur recommandé — CraneTech Germany," Score 91/100, reasons (✓ Conformité 100%, ✓ Genuine, ✓ Délai compatible, ✓ Coût rendu compétitif, ✓ Historique fiable), buttons **Retenir** / **Choisir un autre**.

**Manual supplier selection:** PROMAT always decides, per article, with a bulk action **Appliquer ce fournisseur aux lignes compatibles**. Changing the supplier on any line must immediately recalculate purchase cost, customs, approach-cost allocation, landed cost, margin, and final selling price for that line and any dependent totals.

### Frais d'approche
Two modes: **Frais globaux** / **Frais spécifiques**. Types: Fret, Transit, Banque, Assurance, Manutention, Transport local, Inspection, Divers. Table: Type, Description, Montant, Devise, MAD, Allocation, Document, Action. Button **+ Ajouter un frais**.

**Allocation methods:** Prorata valeur achat (default), Prorata quantité, Prorata poids, Montant fixe, Répartition manuelle — with the calculation shown transparently, not just the result.

### Douane & devises
**Currency management** — table: Devise, Taux, Date, Source, Override, for MAD, EUR, USD, GBP, CNY. A manually edited rate gets a "Taux manuel" badge, and every dependent calculation updates immediately.

**Customs management** — per article: Article, Country of origin, Purchase value, Customs code, Customs rate, Customs amount, Source, Override, Comment. Actions: **Appliquer aux lignes sélectionnées**, **Appliquer globalement**.

### Prix de revient (landed cost)
Formula, implemented as live functional math, not a static display:

```
Prix d'achat fournisseur × quantité × taux de change  =  Valeur d'achat (MAD)
Valeur d'achat + Douane + Fret + Transit + Frais bancaires
  + Assurance + Transport local + Frais divers
  =  PRIX DE REVIENT PROMAT
```

Table: Ligne, Article, Fournisseur, Qté, PU devise, Devise, Taux, Achat MAD, Douane, Fret, Transit, Banque, Assurance, Divers, PR total, PR unitaire — with an expandable breakdown per line. Changing supplier, quantity, currency, exchange rate, customs rate, freight, or margin anywhere must immediately propagate through this table and every downstream total.

### Marge & prix de vente
Support Marge globale, Marge par article, and Marge par famille.

Table: Article, PRU, Margin %, Margin MAD, PVU, Qty, Total HT, Statut. Rules: 20% recommended, <15% "À surveiller," <12% "Critique." The system never blocks the user on a critical margin, but requires a written justification for it.

**Margin simulator** (visually prominent, slider or input over 15/18/20/22/25%): live-updates selling total, gross margin, margin %, and difference vs. client estimate as the value changes, with animated transitions on the numbers. Button **Appliquer cette simulation**.

**Financial summary panel** (sticky): Achats fournisseurs, Frais d'approche, Douane, Prix de revient, Offre PROMAT HT, Marge brute, Marge moyenne — all live.

**Client estimate comparison** (when a client estimate exists): Estimation client, Offre PROMAT, Écart MAD, Écart % under a "Positionnement financier" label. Never claim PROMAT will win the tender.

### Bordereau AO
Reconstructs the final client pricing schedule, preserving the AO's original line structure: Code, Désignation originale, Unité, Quantité, PU PROMAT, Total. **Never expose supplier internal cost here.**

**Internal vs. client view toggle:**
- *Vue interne PROMAT:* supplier, purchase cost, customs, fees, PR, margin, sale price.
- *Vue offre client:* code, designation, unit, quantity, PU, total only.

### Contrôles
**Automatic financial controls** detect: missing line, missing price, quantity modified, unit modified, code modified, duplicate line, unauthorized additional line, total mismatch, too many decimals — flagged ✅ Conforme / ⚠ À corriger.

**Final readiness controls**, in three sections (Administratif, Technique, Financier), each a checklist, rolling up to a **"Dossier prêt à XX %"** readiness score with a breakdown by section and an explicit blockers list (e.g. "1 élément bloque la finalisation" → **Voir le blocage**).

### Versions
V1 / V2 / V3, each storing a full snapshot: suppliers, exchange rates, customs, costs, PR, margin, selling price. Actions: **Comparer**, **Restaurer**, **Dupliquer**. Version comparison is side-by-side and visually highlights every changed field (supplier, purchase price, exchange rate, duties, landed cost, margin, selling price).

### Decision Rail — Agent Chiffrage
"À faire" (Valider fournisseur, Vérifier douane, Confirmer taux EUR, Valider marge, Ajouter fiche technique), Recommandation Agent, Risques, Prochaine étape.

### Final approval
Button **Valider le chiffrage** opens a confirmation drawer summarizing AO, client, selected suppliers, purchase cost, landed cost, proposed price, margin, and warnings, gated by the checkbox "Je confirme les fournisseurs retenus, les coûts et les prix proposés" and a **Valider définitivement** button. Records approver and timestamp.

## 11.3 Offres finales (Final Offer workspace)
Tabs: Synthèse, Bordereau, Technique, Administratif, Pièces jointes, Validation.

Synthèse shows Client, AO, Objet, HT, TVA, TTC, Date limite, Statut ("Prête à déposer").

**Exports** (mock-functional, i.e. actually produce a downloadable file or a clear completed state): **Exporter bordereau Excel**, **Générer offre PDF**, **Télécharger dossier**, **Marquer prêt à déposer**. Client-facing exports must never expose internal purchasing information.

**Submission:** **Marquer comme déposé** transitions status through Déposé → En attente → Gagné / Perdu / Annulé.
- If **Gagné:** record contract reference, purchase order, award date, final amount; display "Marché remporté."
- If **Perdu:** optional fields competitor, winning price, reason, comment — retained for future supplier/pricing intelligence.

---

# 12. DECISION RAIL (cross-cutting component)

A premium sticky right-side panel present on important screens (tender workspace, chiffrage workspace). It must feel like an intelligent operational assistant embedded in the workflow — never a chatbot. Standard content: "À faire" checklist, "Prochaine échéance," "Risque principal," "Recommandation Agent," and a call-to-action button. On tablet widths it collapses into an accessible drawer (Section 8.3).

---

# 13. ROLES & PERMISSIONS

- **Administrateur** — full access.
- **Responsable Commercial** — GO/NO GO, supplier final choice, margin approval, offer validation.
- **Acheteur** — suppliers, RFQs, quotations, sourcing.
- **Chiffreur** — comparison, costs, customs, exchange, margin preparation.

Implement role-based visibility: actions and edit rights outside a role's scope should be visibly restricted, not just hidden arbitrarily.

---

# 14. SETTINGS (Paramètres)

Tabs: Société, Utilisateurs, Rôles, Familles produits, Sources AO, Marges, Devises, Frais standards, Douane.

---

# 15. ACTIVITY HISTORY (Historique)

Track every important action across both agents: GO validé, Fournisseur sélectionné, RFQ envoyée, Devis reçu, Taux de change modifié, Marge modifiée, Chiffrage validé, Offre déposée, etc. Each entry stores date, user, object, and old/new value where applicable. This is what powers the audit trail behind every workflow-unlock and status change referenced elsewhere in this spec.

---

# 16. NOTIFICATIONS & TOASTS

**Notification center:** 🔵 Nouvelle opportunité AO détectée, 🟠 Réponse fournisseur en retard, 🔴 Marge critique, 🟢 Chiffrage validé, 🟣 Nouvelle offre fournisseur reçue — each with unread state, timestamp, priority, action, "mark as read," and "mark all as read."

**Toast system** for every meaningful operation (never a default browser alert): "AO créé avec succès," "Analyse terminée," "GO validé," "Fournisseur sélectionné," "Consultation générée," "Offre fournisseur enregistrée," "Taux de change mis à jour," "Chiffrage validé," "Version restaurée," "Offre prête à déposer."

---

# 17. GLOBAL SEARCH

Search across AO, clients, suppliers, products, PROMAT references, manufacturer references, and documents, with results grouped by type, e.g.:

```
Appels d'offres → AO 24/DRC/CI/2026
Fournisseurs   → CraneTech Germany
Articles       → DM-450 Flow Meter
Documents      → Fiche technique DM-450
```

---

# 18. MOCK DATA REQUIREMENTS

Do not use generic placeholders ("Supplier 1," "Company A," "Product XYZ"). Populate with realistic enterprise data, minimum:

- 12 tenders (appels d'offres)
- 15 suppliers (fournisseurs)
- 30 articles
- 10 RFQs
- 15 supplier quotations
- 5 costings (chiffrages)
- 20 documents

Use real-feeling Moroccan and international organizations (ONEE, OCP, Marsa Maroc, ONCF, ADM as clients; European/international supplier names by category), realistic industrial categories (Levage, Manutention, Grues, Pièces détachées, Hydraulique, BTP, Mines, Portuaire, Équipements industriels), and realistic references, MAD/EUR/USD prices, quantities, dates, supplier countries, product references, margins, customs rates, freight costs, delivery times, and technical specifications.

---

# 19. MAIN DEMONSTRATION TENDER (fully navigable end to end)

- **Tender:** AO 24/DRC/CI/2026
- **Client:** ONEE – Branche Eau
- **Objet:** Acquisition de débitmètres électromagnétiques
- **Budget:** 1 200 000 MAD TTC
- **Caution:** 12 000 MAD
- **Date limite:** 23/07/2026
- **Lieu:** Rabat / Casablanca-Settat
- **Pertinence:** 86 %
- **Risque:** Moyen

Build this tender with fully realistic content at every stage — administrative requirements, technical requirements, eligibility matrix, articles, suppliers, RFQs, quotations, comparison, landed costs, margin, BPU, final offer — so it can carry the entire demo below by itself.

### Full demo walkthrough (must all work, in order)
1. Open new AO.
2. Click **Analyser** → Agent generates the synthesis.
3. Open **Éligibilité**.
4. Click **Valider GO** → confirm the GO.
5. Agent extracts articles (Articles & besoins tab populates).
6. Agent suggests suppliers.
7. PROMAT selects suppliers.
8. Create RFQs.
9. Add supplier quotations.
10. Click **Passer au chiffrage**.
11. Compare suppliers (Comparatif fournisseurs).
12. Select a supplier (recommended or manual).
13. Add freight / customs / bank costs.
14. System calculates landed cost live.
15. Set margin (simulator).
16. System calculates client price live.
17. Generate the BPU (Bordereau AO).
18. Run Contrôles.
19. Validate the chiffrage (**Valider le chiffrage**).
20. Mark the offer ready (**Marquer prêt à déposer**).
21. Mark as submitted (**Marquer comme déposé**).

---

# 20. FUNCTIONAL COMPLETENESS CHECKLIST ("nothing is decorative")

Implement, with real behavior, not appearance-only: routing, navigation, global search, filters (all pages listed above), sorting, pagination, saved views, tabs, drawers, full CRUD where described, forms with validation, confirmation dialogs, toast feedback, status transitions, all financial calculations (Section 11.2), currency updates, customs updates, cost allocation methods, the margin simulator, versioning (create/compare/restore/duplicate), final validation flows, and local persistence of every change (new AO, edited article, new supplier, modified quotation, margin change, supplier selection, exchange-rate change, GO validation, any status change) across navigation and reload.

---

# 21. FINAL UX PRINCIPLE

Every important screen must let the user answer, at a glance:

- Où en est ce dossier ?
- Qu'est-ce qui manque ?
- Quelle décision dois-je prendre ?
- Quelle est la recommandation de l'Agent ?
- Quelle est la prochaine étape ?

---

# 22. MOST IMPORTANT DESIGN DIRECTIVE

"Premium" does not mean more gradients, more shadows, or more cards. Premium means: excellent hierarchy + intelligent spacing + sophisticated typography + meaningful (not gratuitous) animation + strong, consistent branding + realistic data + precise interactions + exceptional usability. Every component must earn its place. The interface should feel calm, powerful, intelligent, industrial, and exceptionally polished — a real PROMAT Procurement Operating System, not a dashboard template.

---

# 23. FINAL QUALITY GATE

Before considering the build complete, verify all of the following:

- [ ] The real PROMAT logo file and favicon files (Section 5.0, sourced from https://promat.co) are used verbatim — not a redrawn or invented logo
- [ ] Favicon actually configured in app metadata using PROMAT's real favicon files
- [ ] Color palette uses PROMAT's real verified brand hex values (`#E50D2D` red, `#1D2A4D` navy, `#0086FF`/`#D7E8FF` light blue, per Section 5.0/5.3) rather than a generic invented palette
- [ ] Login works end to end with pre-filled demo credentials
- [ ] French language throughout, no stray English strings
- [ ] Animated premium background present and non-distracting
- [ ] Light mode and dark mode both fully polished (not inverted black)
- [ ] Sidebar collapsible; Decision Rail becomes a drawer on tablet
- [ ] Every primary/secondary/danger/icon button is functional with full feedback (loading → result → toast → log)
- [ ] Every form validates, saves, and persists
- [ ] Filters, search, sorting, and pagination work on every listed data page
- [ ] Saved views work (create, apply, appear as chips)
- [ ] Tables meet the full spec in Section 7 (sticky header/column, expandable rows, bulk actions, etc.)
- [ ] Drawers and modals fit entirely inside the viewport at 1440px, 1366px, and 1024px
- [ ] Mock data meets or exceeds every minimum in Section 18, with realistic (not placeholder) names and values
- [ ] Industrial imagery used purposefully, not randomly
- [ ] Full tender workflow timeline functions and is navigable
- [ ] GO/NO GO flow functions with reason capture on NO GO
- [ ] Supplier sourcing, RFQ, and quotation flow function end to end, with shared-data propagation into Agent Chiffrage (Section 3)
- [ ] Comparatif fournisseurs, recommendation logic, and manual selection all function and trigger recalculation
- [ ] Currency, customs, freight, and landed-cost calculations are live and correct
- [ ] Margin simulator updates live and "Appliquer cette simulation" works
- [ ] BPU / Bordereau AO correctly separates internal vs. client views (no cost leakage to client view)
- [ ] Contrôles and readiness score function and correctly surface blockers
- [ ] Versioning (create/compare/restore/duplicate) functions
- [ ] Final chiffrage validation and final offer submission flow function, including Gagné/Perdu outcomes
- [ ] Notification center and toast system both function
- [ ] All changes persist locally across navigation and reload
- [ ] Responsive and unclipped at 1440px, 1366px, and 1024px
- [ ] No dead decorative buttons anywhere
- [ ] No generic placeholder business data anywhere
- [ ] No generic, template-feeling dashboard styling anywhere

**Build the complete application now. Do not explain what you are going to build. Do not display this prompt. Start directly with the functional PROMAT login experience, then the operational Command Center.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cc396316-be4c-4303-a724-9c3b7de44c56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
