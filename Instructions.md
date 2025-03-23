# BLIA.AI Platform Instructions

## Language Requirements

**IMPORTANT: All content within the BLIA.AI platform MUST be in English.**

This includes:
- User interface elements
- Generated roadmaps and learning paths
- Instructions and descriptions
- Tests and lesson materials
- Error messages and system notifications

When the AI generates content (roadmaps, career paths, suggestions, etc.), it MUST generate this content in English, regardless of any other settings or user preferences.

## Career Roadmap Generation

When generating career roadmaps:
1. All roadmap content must be in English
2. Section titles, descriptions, and subtasks must use professional terminology
3. Skills extraction should focus on relevant technical and professional skills only
4. Generic terms like "main", "stage", "lesson", "understanding", etc. should NOT be included as skills
5. Only include 12-15 most relevant skills per roadmap
6. Prioritize specific technical terms (programming languages, tools, frameworks) and industry-specific concepts

## User Interface Guidelines

1. Maintain consistent terminology across the platform
2. Use clear, concise English for all UI elements
3. Ensure proper English grammar and spelling in all generated content
4. For any translated content, verify translations maintain technical accuracy

## Development Notes

- All component text and labels must be in English
- API responses should include English content only
- System prompts to AI services must specify English output
- Roadmap generation should ensure technical accuracy in English terminology

This document serves as the definitive guide for language requirements on the BLIA.AI platform. Any deviations from these requirements should be considered bugs and addressed promptly.

Aplicație educaționala, construită strict cu Next.js, Tailwind CSS, Firebase, Firebase Auth, ShadCn și Stripe. Platforma include Career Paths generate de AI, lecții școlare personalizate, gamification și un sistem avansat de generare și monitorizare a progresului în carieră. Iată instrucțiunile detaliate actualizate:

### Structura clară și detaliată a fișierelor aplicației:

```
/app
  ├── layout.tsx (layout global principal)
  ├── page.tsx (pagina principală de intrare)
  ├── (auth)
  │   ├── auth
  │   │   └── page.tsx (login/register)
  │   └── forgot-password
  │       └── page.tsx (resetare parolă)
  ├── (dashboard)
  │   ├── layout.tsx (layout dashboard)
  │   └── dashboard
  │       ├── page.tsx (pagina dashboard principală cu profil și roadmap carieră)
  │       ├── create-path
  │       │   └── page.tsx (creare path nou)
  │       ├── school
  │       │   └── page.tsx (lecții școlare)
  │       └── profile
  │           └── page.tsx (gestionare profil utilizator)
  ├── (premium)
  |   |-- layout.tsx
  │   ├── premium
  |       |-- page.tsx(abonamente premium)
  │   ├── success
  │   │   └── page.tsx (confirmare plată reușită)
  │   └── cancel
  │       └── page.tsx (confirmare plată anulată)
  └── (paths)
      |-- layout.tsx
      |-- paths
          ├── page.tsx (pagina publică paths)
          └── [pathId].tsx (pagina detaliată path)
/components
  ├── ui (componente ShadCn)
  └── shared (componente comune reutilizabile)
/context
  ├── AuthContext.tsx (context global autentificare și roluri)
  ├── SubscriptionContext.tsx (context global abonamente și beneficii premium)
  └── UserContext.tsx (context global date utilizator și progres)
/hooks
  └── useAuth.ts (hook personalizat autentificare)
/lib
  ├── firebase.ts (config Firebase)
  ├── firestore.ts (interacțiuni Firestore)
  └── stripe.ts (integrare Stripe)
/public
  └── assets (imagini, iconuri)
/functions
  ├── stripeWebhook.ts (gestionare webhook Stripe și update roluri Firebase)
  └── validatePath.ts (validare paths generat de AI)
```

### Reguli Firebase Security avansate:

- Date securizate prin permisiuni clare pe bază de roluri (Standard/Premium).
- Validare riguroasă pentru prevenirea fraudei (abonamente premium).

### Autentificare și abonamente detaliate:

- Autentificare Firebase Auth (email, Google, GitHub, Twitter).
- Redirect automat după login/register la dashboard.
- Stripe gestionează plățile, webhook integrat cu Firebase Functions pentru actualizarea rolurilor.

### Dashboard avansat cu generare career roadmap:

- **Profil detaliat:** editare și personalizare.
- **Tab-uri clare:** "All Paths", "Completed Paths", "Saved Paths".
- Buton "Generate Your Career":
  - AI-ul creează un roadmap personalizat cu multiple ramuri de cunoaștere.
  - Secțiuni și subsecțiuni clar definite (ex: Frontend > React > Hooks).
  - Roadmap-ul necesită completarea path-urilor dedicate pentru progres.
  - Aplicația sugerează automat paths relevante roadmap-ului.
  - La crearea unui nou path, aplicația întreabă explicit utilizatorul dacă acesta corespunde cu roadmap-ul său de carieră.
  - În dashboard, utilizatorul are vizualizare clară a progresului și sugestii automate de paths.

### Funcționalități avansate și detaliate:

- **Paths și lecții:** AI generează lecții care includ test final obligatoriu pentru marcare ca finalizat.
- **Progres detaliat:** Finalizarea unui path actualizează automat progresul pentru secțiunile/subsecțiunile relevante ale roadmap-ului personal.
- **Gamification avansată:** puncte, niveluri, badge-uri și clasamente pe baza progresului și activității.
- **Interacțiuni sociale:** Reviews, like-uri și donații directe prin Stripe.

### Gamification extins și motivațional:

- Sistem avansat de puncte și niveluri bazat pe activități (lecții/path-uri).
- Badge-uri clare și atractive pentru realizări specifice.
- Clasament vizibil public pentru competiție pozitivă între utilizatori.

### Context și Management de stare clar și eficient:

- **AuthContext:** autentificare utilizatori și roluri.
- **SubscriptionContext:** abonamente și funcționalități premium.
- **UserContext:** acces rapid la date utilizator, roadmap, paths salvate și progres.

### Provocări anticipate și soluții detaliate:

- **Calitatea paths:** validare dublă AI, teste automate, feedback utilizatori.
- **Testare automată:** sandbox-uri dedicate, externalizare teste complexe.
- **Adaptarea lecțiilor:** caching, flexibilitate curricule.
- **Optimizare backend:** optimizare query-uri Firestore, caching local și AWS.
- **Monetizare:** trial-uri gratuite și gamification puternic pentru motivare continuă.
- **Performanță:** modularitate, lazy-loading, optimizare SSR Next.js.

### Rezumat rapid al aplicației:

- Dashboard avansat cu profil și roadmap personalizat.
- Paths AI detaliate și lecții interactive.
- Gamification pentru motivare și retenție.
- Backend robust Firebase și autentificare securizată.
- Design modern, minimalist, responsive și atractiv.

Folosește exclusiv documentațiile oficiale:

- [Stripe Docs](https://docs.stripe.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs/installation/using-vite)
- [Firebase Docs](https://firebase.google.com/docs/build)
- [ShadCn Docs](https://ui.shadcn.com/docs/installation)
- [OpenAI Docs](https://platform.openai.com/docs/overview)

### Restricții stricte pentru dezvoltare:

- Nu modifica funcționalități existente fără solicitare explicită.
- Respectă strict cerințele prezentate.
- Nu modifica designul fără solicitare explicită.
- Folosește flat design minimalist, responsive, modern și culori pozitive (ex: green-500).
- Cod clar, documentat, structurat și reutilizabil.
- Compatibilitate strictă ESLint, TypeScript.
- Aplicație multilingvă, implicit în limba engleză.

