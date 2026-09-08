# Promat Flow

Build a completely redesigned MVP for PROMAT Morocco focused on ONLY TWO AI AGENTS:

1. Agent AO & Analyse

2. Agent Chiffrage

The objective is to radically simplify the user experience.

IMPORTANT:

Do NOT create many separate modules, pages or complex side navigation.

The user must be able to process an entire tender with almost no navigation.

The whole application should feel like a guided workflow.

UI language: French.

Target users: PROMAT commercial, sourcing and costing teams.

Style: premium industrial B2B SaaS, very modern, extremely readable, innovative but not futuristic or gimmicky.

==================================================

CORE UX PRINCIPLE

==================================================

The platform must have ONLY TWO main workspaces:

- Agent AO & Analyse

- Agent Chiffrage

A tender must progress naturally inside these two workspaces.

The user must never have to navigate through separate pages such as:

Analyses,

Articles,

Suppliers,

Consultations,

Comparisons,

Costing,

Margins,

Final offers.

All these functionalities must exist INSIDE the two agent workspaces.

Think of the application as a guided "Tender Workspace".

The main workflow is:

AGENT AO & ANALYSE

Tender detected / added

→ AI analysis

→ GO / NO GO

→ Articles extracted

→ Supplier sourcing

→ Supplier consultation

→ Send to costing

then

AGENT CHIFFRAGE

Supplier offers received

→ Supplier comparison

→ Supplier selection

→ Landed cost calculation

→ Margin

→ Final selling price

→ Final client offer

==================================================

GLOBAL NAVIGATION

==================================================

Do not use a large sidebar with 15 modules.

Use a very minimal navigation.

Left sidebar:

PROMAT logo

01 Agent AO & Analyse

02 Agent Chiffrage

Bottom:

Settings icon

User profile

That's it.

Top header:

- Global search

- Notifications

- Current user

The interface must immediately feel simple.

==================================================

WORKSPACE 1

AGENT AO & ANALYSE

==================================================

The Agent AO & Analyse workspace must allow the user to manage everything related to the tender BEFORE costing.

Use a split-screen layout.

LEFT COLUMN:

Tender list.

RIGHT SIDE:

Selected tender workspace.

Example left panel:

Search...

Filtres:

Tous

À analyser

Décision requise

En consultation

Prêt pour chiffrage

Tender cards must be compact.

Example:

ONEE – Branche Eau

AO 24/DRC/CI/2026

Débitmètres électromagnétiques

Échéance: 23 juil.

Statut: Décision requise

Do NOT show too much information in the tender card.

Only show:

client

reference

short title

deadline

current status

==================================================

TENDER HEADER

==================================================

When opening a tender, show a very clean header.

Example:

ONEE – Branche Eau

AO 24/DRC/CI/2026

Acquisition de débitmètres électromagnétiques

[ GO recommandé ]

Budget

1 200 000 MAD TTC

Caution

12 000 MAD

Échéance

23 juillet 2026

At the right:

Score pertinence

88%

Primary action:

Examiner la décision

Do NOT show 15 KPIs.

Only show the information that helps make a decision.

==================================================

GUIDED WORKFLOW

==================================================

At the top of the tender workspace, create a horizontal workflow stepper:

01 Analyse

02 Décision

03 Articles

04 Fournisseurs

05 Consultation

The user stays on the SAME PAGE.

Clicking a step smoothly scrolls or changes the content area without leaving the tender.

Current step must be visually highlighted.

Completed steps show a checkmark.

Example:

✓ Analyse

● Décision

○ Articles

○ Fournisseurs

○ Consultation

==================================================

STEP 1 — ANALYSE

==================================================

The AI analysis must NOT generate huge text blocks.

Create a very readable executive summary.

Header:

Analyse IA du dossier

Small subtitle:

Les informations essentielles pour décider rapidement.

Show only 4 blocks.

1. L'opportunité

Client

ONEE – Branche Eau

Objet

Acquisition de débitmètres électromagnétiques

Budget

1 200 000 MAD TTC

Échéance

23 juillet 2026

2. Ce qui est demandé

Use maximum 4 short bullets.

Example:

• Fourniture de débitmètres électromagnétiques

• Documentation technique fabricant requise

• Références similaires demandées

• Respect des spécifications techniques du dossier

3. Points de vigilance

Use small alert cards.

Example:

⚠ Références similaires à confirmer

⚠ Validation technique fabricant nécessaire

✓ Caution compatible

Do not display long legal explanations.

Add a discreet link:

Voir l'analyse complète

Clicking this opens a SIDE DRAWER, not a new page.

The drawer can contain detailed extracted information:

administrative,

technical,

financial,

documents,

clauses.

The default screen must remain clean.

==================================================

AI SUMMARY

==================================================

Add an AI insight card:

Recommandation de l'Agent

GO recommandé

"Le dossier semble compatible avec les capacités PROMAT.

Deux points restent à valider avant engagement."

Confidence:

88%

Buttons:

Continuer

Voir les points à vérifier

==================================================

STEP 2 — DECISION GO / NO GO

==================================================

Create a simple decision interface.

Title:

Décision GO / NO GO

Display a compact eligibility matrix.

Example:

Chiffre d'affaires

Conforme ✓

Références similaires

À confirmer ⚠

Capacité technique

Conforme ✓

Caution

Conforme ✓

Délai

Compatible ✓

Then show:

Éligibilité estimée

88%

Recommendation:

GO recommandé

Two large buttons:

Valider GO

Classer NO GO

If NO GO is selected, open a small modal asking:

Pourquoi ?

Options:

- Non éligible

- Délai insuffisant

- Sourcing impossible

- Risque technique

- Rentabilité estimée insuffisante

- Autre

If GO is selected:

automatically unlock Step 3.

Show a small transition message:

GO validé

L'Agent a préparé les articles à sourcer.

Button:

Voir les articles

==================================================

STEP 3 — ARTICLES & BESOINS

==================================================

Do not create another page.

Display extracted products directly inside the same tender workspace.

Use a clean editable table.

Columns:

Référence

Désignation

Qté

Unité

Spécifications

Statut

Example:

001

Débitmètre électromagnétique DN600

2

U

PN25 · IP67+ · Bidirectionnel

Validé

Do NOT put 15 technical columns.

All secondary specifications should appear inside one concise "Spécifications" column.

When clicking an article, open a right side drawer with:

- full technical specification

- source document

- historical PROMAT references

- historical supplier

- previous price

Add AI indicator:

Référence similaire détectée dans l'historique PROMAT.

Previous supplier:

FlowTech

Previous price:

4 050 EUR

Buttons:

Modifier

Valider l'article

At top of article section:

12 articles détectés

10 validés

2 à vérifier

Primary button:

Valider les articles

Once validated:

automatically unlock Supplier step.

==================================================

STEP 4 — FOURNISSEURS

==================================================

The goal is to make sourcing extremely visual.

For each important article, show recommended suppliers in compact cards.

Example:

FlowTech Germany

94% Match

Genuine

Délai moyen: 4 sem.

Dernière consultation: 2025

[ Sélectionner ]

HydroTech France

89% Match

OEM / Genuine

Délai moyen: 5 sem.

[ Sélectionner ]

Do not overload supplier cards.

Add an AI explanation displayed only on request:

Pourquoi ce fournisseur ?

Open a small tooltip / drawer containing:

- product compatibility

- previous PROMAT history

- average response time

- previous price competitiveness

Allow multi-select.

At top:

Fournisseurs recommandés

For 12 articles:

8 suppliers suggested

5 selected

Primary button:

Créer la consultation

==================================================

STEP 5 — CONSULTATION

==================================================

After suppliers are selected, generate the RFQ directly.

Show one consultation workspace.

Example header:

Consultation RFQ-2026-0048

AO:

ONEE – 24/DRC/CI/2026

3 fournisseurs

12 articles

Then show supplier status as cards:

FlowTech Germany

Envoyée

Réponse attendue

15 juil.

HydroTech France

Offre reçue

Aujourd'hui

EuroFlow Turkey

En attente

Relance possible

Actions:

Relancer

Voir l'offre

Ajouter une réponse

Do NOT create a separate supplier response module.

Supplier responses must be accessible directly here.

==================================================

HANDOFF TO AGENT CHIFFRAGE

==================================================

Once enough offers are received, show a prominent bottom action bar.

Example:

3 offres fournisseurs reçues

Le dossier est prêt pour le chiffrage.

Primary button:

Transmettre au chiffrage →

When clicked:

open the SAME tender directly inside Agent Chiffrage.

Do not make the user search for the tender again.

==================================================

WORKSPACE 2

AGENT CHIFFRAGE

==================================================

The Agent Chiffrage workspace must also work as one continuous page.

Left:

List of tenders ready for costing.

Right:

Selected tender costing workspace.

Use a new horizontal stepper:

01 Offres fournisseurs

02 Comparatif

03 Coûts

04 Marge

05 Offre finale

Again:

NO page switching.

==================================================

STEP 1 — OFFRES FOURNISSEURS

==================================================

Show a compact summary of received offers.

Example:

3 fournisseurs

12 articles

36 propositions reçues

Display a compact table by article.

Article:

Débitmètre DN600

FlowTech

4 200 EUR

Genuine

4 sem.

HydroTech

3 950 EUR

OEM

7 sem.

EuroFlow

4 500 EUR

Genuine

3 sem.

Avoid excessive columns.

Secondary information should appear in a detail drawer.

==================================================

STEP 2 — COMPARATIF

==================================================

Create a highly visual comparison.

The AI must compare:

- Price

- Technical compliance

- Genuine/OEM

- Lead time

- Incoterm

- Origin

- PROMAT history

- Estimated landed cost

But do not show all this in a giant spreadsheet.

Show a recommendation card.

Example:

Recommandation Agent

FlowTech Germany

Score

91 / 100

Why:

✓ Conforme

✓ Genuine

✓ Délai compatible

✓ Historique fiable

Price:

4 200 EUR

Button:

Retenir ce fournisseur

Secondary:

Comparer en détail

The detailed comparison opens a drawer.

PROMAT must always be able to override the AI recommendation.

==================================================

STEP 3 — COÛTS

==================================================

Create an elegant landed cost calculator.

Do not make it look like Excel.

Use clear sections.

Achat fournisseur

92 400 MAD

+

Fret

10 000 MAD

+

Douane

2 310 MAD

+

Autres frais

3 000 MAD

=

Prix de revient

107 710 MAD

Use inline editable values.

Include:

Taux EUR/MAD

11.00

Fret

editable

Transit

editable

Banque

editable

Assurance

editable

Douane

editable

Other costs

editable

Every modification recalculates immediately.

Display one strong result:

PRIX DE REVIENT

107 710 MAD

Avoid showing unnecessary formulas unless the user asks.

Add:

Voir le détail du calcul

Open detailed calculation in a drawer.

==================================================

STEP 4 — MARGE

==================================================

Create a margin simulator.

Large slider or elegant segmented options:

15%

18%

20%

22%

25%

Also allow custom value.

Example:

Prix de revient

107 710 MAD

Marge

20%

Prix de vente

129 252 MAD

Gain brut

21 542 MAD

Add a visual status:

Marge saine

or

Marge faible

or

Marge critique

Allow:

- global margin

- per article margin

But keep global margin as the default UI.

Per article margin should only appear through:

"Ajuster par article"

==================================================

STEP 5 — OFFRE FINALE

==================================================

Create a clean final client offer preview.

Very important:

The client view must NOT display:

supplier name

purchase price

landed cost

internal margin

internal notes

Show only:

Code

Désignation

Unité

Quantité

Prix unitaire

Total

At top show:

Montant total HT

Marge moyenne

État du dossier

Example:

1 015 092 MAD HT

Marge moyenne

20,4%

Dossier

Prêt

Checklist:

✓ Articles validés

✓ Fournisseurs sélectionnés

✓ Coûts calculés

✓ Marge validée

✓ Prix renseignés

Primary button:

Valider l'offre finale

Secondary buttons:

Exporter Excel

Générer PDF

==================================================

INNOVATIVE DESIGN DIRECTION

==================================================

The design must feel more modern and premium than a traditional ERP.

Avoid:

- giant dashboards

- dozens of cards

- overloaded tables

- very small text

- too many borders

- excessive colors

- excessive metrics

- complex nested menus

Use:

- large whitespace

- clear typography hierarchy

- large readable titles

- compact but comfortable tables

- sticky workflow stepper

- smooth transitions

- progressive disclosure

- side drawers for secondary details

- contextual AI insights

- clear primary actions

- smart empty states

- subtle micro-interactions

==================================================

VISUAL STYLE

==================================================

PROMAT identity.

Overall background:

very light cool gray / off-white.

Sidebar:

deep navy / charcoal.

Primary text:

dark navy.

Accent:

PROMAT red used sparingly for primary CTA and active states.

Secondary AI accent:

soft blue.

Success:

soft green.

Warnings:

soft amber.

Use subtle shadows.

Rounded cards:

10-14px radius.

No heavy gradients.

No glassmorphism.

No neon.

No generic AI robot graphics.

The product should look like:

premium B2B procurement software

+

modern financial SaaS

+

AI-assisted workflow.

Typography should be very readable.

Recommended visual hierarchy:

Page title:

28-32px bold

Section title:

18-20px semibold

Body:

14-16px

Labels:

12-13px

==================================================

IMPORTANT UX RULE

==================================================

Every screen should answer only 3 questions:

1. Where am I in the tender?

2. What do I need to know?

3. What do I need to do next?

If an information does not help answer one of these questions, hide it by default.

Place secondary details behind:

"Voir le détail"

Never overload the main interface.

==================================================

DEMO DATA

==================================================

Use ONEE tender as the main demo.

Client:

ONEE – Branche Eau

Reference:

AO 24/DRC/CI/2026

Object:

Acquisition de débitmètres électromagnétiques pour le secteur de production Settat – Berrechid – Benslimane

Estimated amount:

1 200 000 MAD TTC

Provisional guarantee:

12 000 MAD

Use realistic sample suppliers and costing values for the demo.

Also create 3 additional demo tenders:

OCP Group

ONCF

Marsa Maroc

But ONEE must be the guided example.

==================================================

FINAL EXPECTED EXPERIENCE

==================================================

A PROMAT employee should be able to open ONEE and complete the entire process with this experience:

Agent AO & Analyse

Open ONEE

→ read AI summary

→ validate GO

→ validate extracted articles

→ select suppliers

→ launch consultation

→ receive supplier quotations

→ click "Transmettre au chiffrage"

Agent Chiffrage opens automatically

→ review offers

→ select supplier

→ validate landed cost

→ choose margin

→ preview client offer

→ validate final offer

The user should feel that the AI is guiding the process, not that they are navigating an ERP.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b154d2a-c3f1-4660-9063-14a0ff124ce0).

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
