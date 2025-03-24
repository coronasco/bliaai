# BLia AI - Documentație Completă

## Prezentare Generală

BLia AI este o platformă educațională care utilizează inteligența artificială pentru a crea trasee de învățare personalizate. Aplicația ajută utilizatorii să-și dezvolte cariera prin generarea de roadmap-uri personalizate, crearea de quizuri interactive, și oferirea unui sistem de gamification pentru a menține motivația.

## Design General

- **Temă**: Dark mode cu accente de culoare gradient
- **Culori Principale**: 
  - Fundal: nuanțe de gri închis (#121212, #1E1E1E, #2D2D2D)
  - Accente: gradient-uri de violet-albastru (#6D28D9 - #2563EB) și galben-portocaliu (#F59E0B - #D97706) pentru elemente premium
  - Text: alb (#FFFFFF) și nuanțe de gri deschis (#E5E5E5, #A3A3A3)
- **Tipografie**:
  - Font principal: Inter sau similar
  - Titluri: fontul principal, bold, dimensiuni mai mari
  - Text: fontul principal, greutate normală sau light
- **Layout**: Full-screen cu margini responsive
- **Componente UI**: Stilizate folosind Tailwind CSS și shadcn/ui

## Structura Aplicației

```
app/
├── (auth)/
│   └── auth/
│       └── page.tsx - Pagina de autentificare/înregistrare
├── (dashboard)/
│   ├── dashboard/
│   │   ├── page.tsx - Dashboard principal
│   │   ├── profile/
│   │   │   └── page.tsx - Pagina de profil utilizator
│   │   ├── roadmaps/
│   │   │   ├── page.tsx - Lista de roadmap-uri
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx - Vizualizare roadmap specific
│   │   │   │   └── subtasks/
│   │   │   │       └── [subtaskId]/
│   │   │   │           └── page.tsx - Pagina de subtask
│   │   │   └── create/
│   │   │       └── page.tsx - Creare roadmap nou
│   │   ├── quizzes/
│   │   │   ├── page.tsx - Lista de quizuri
│   │   │   └── [id]/
│   │   │       └── page.tsx - Quiz specific
│   │   └── feedback/
│   │       └── page.tsx - Pagina de feedback
│   └── admin/
│       ├── page.tsx - Dashboard admin
│       └── feedback/
│           └── [id]/
│               └── page.tsx - Procesare feedback specific
├── (premium)/
│   └── premium/
│       ├── page.tsx - Pagina de upgrade la premium
│       ├── success/
│       │   └── page.tsx - Confirmare plată reușită
│       └── cancel/
│           └── page.tsx - Anulare plată
└── layout.tsx - Layout principal

components/
├── ui/ - Componente de bază UI
├── shared/ - Componente partajate
│   ├── BeginnerTutorial.tsx - Tutorial pentru începători
│   ├── UserCard.tsx - Componentă card utilizator
│   └── gamification/
│       └── GamificationDashboard.tsx - Dashboard gamification
└── ... alte componente

lib/
├── firebase.ts - Configurare Firebase
├── stripe.ts - Configurare Stripe
├── gamification.ts - Logică gamification
├── roadmaps.ts - Logică roadmaps
└── ... alte utilitare

hooks/
├── useAuth.ts - Hook pentru autentificare
├── usePremiumStatus.ts - Hook pentru verificare status premium
└── ... alte hook-uri
```

## Funcționalități Detaliate

### 1. Autentificare și Înregistrare

**Pagina de Autentificare/Înregistrare (`app/(auth)/auth/page.tsx`)**:
- Design full-screen cu pattern de fundal din `public/images/grid-pattern.svg`
- Tabs pentru comutare între Înregistrare și Conectare
- Formular de înregistrare cu câmpuri:
  - Nume Complet
  - Email
  - Parolă
  - Confirmare Parolă
- Formular de conectare cu câmpuri:
  - Email
  - Parolă
- Validare input în timp real
- Mesaje de eroare și succes
- Buton pentru procesare cu stare de loading
- Footer cu copyright

**Proces de Înregistrare**:
1. Utilizatorul introduce datele în formular
2. Validare client-side pentru toate câmpurile
3. Trimitere date către Firebase Authentication
4. Creare document utilizator în Firestore cu:
   - ID utilizator
   - Nume complet
   - Email
   - Data creării
   - Nivel initial (1)
   - Puncte inițiale (0)
   - Preferințe notificări default
5. Redirecționare către dashboard

### 2. Dashboard Principal

**Dashboard Principal (`app/(dashboard)/dashboard/page.tsx`)**:
- Vedere de ansamblu a progresului utilizatorului
- Carduri pentru roadmap-uri active
- Secțiune pentru achievement-uri recente
- Secțiune pentru quizuri disponibile
- Statistici de progres

**Componente Principale**:
- Header cu logo și meniu de navigare
- Sidebar pentru navigare între secțiuni
- Zonă de conținut principal adaptabilă
- Footer cu linkuri utile

### 3. Sistem de Profil

**Pagina de Profil (`app/(dashboard)/dashboard/profile/page.tsx`)**:
- Informații utilizator:
  - Nume, email, avatar
  - Nivel curent și puncte
  - Badge-uri obținute
  - Progres către nivelul următor
- Tabs pentru:
  - Informații personale
  - Abonament
  - Preferințe notificări
- Pentru utilizatori standard:
  - Informații despre ce pot face:
    - Pot începe roadmap-uri create de alții
    - Pot genera quizuri
    - Pot raporta probleme
    - Au acces la funcțiile de bază de gamification
    - Pot obține badge-uri standard
  - Restricții:
    - Nu pot genera roadmap-uri noi
    - Nu pot genera detalii pentru subtask-uri
    - Acces limitat la badge-uri premium
    - Fără acces la analytics avansate
    - Fără suport prioritar
- Pentru utilizatori premium:
  - Detalii abonament
  - Dată reînnoire
  - Opțiune anulare abonament

### 4. Roadmap-uri de Învățare

**Lista de Roadmap-uri (`app/(dashboard)/dashboard/roadmaps/page.tsx`)**:
- Afișare grid cu toate roadmap-urile utilizatorului
- Filtrare după status (active, complete, neîncepute)
- Căutare după titlu/descriere
- Buton pentru crearea unui nou roadmap (doar pentru premium)

**Creare Roadmap (`app/(dashboard)/dashboard/roadmaps/create/page.tsx`)**:
- Formular pentru detalii roadmap:
  - Titlu
  - Domeniu/categorie
  - Nivel de experiență
  - Obiective specifice
- Buton pentru generare cu AI (doar pentru premium)
- Preview roadmap generat
- Opțiune de editare manuală
- Buton de salvare

**Vedere Roadmap (`app/(dashboard)/dashboard/roadmaps/[id]/page.tsx`)**:
- Vizualizare detaliată a unui roadmap specific
- Afișare progres general
- Listă de task-uri principale cu status
- Timeline vizual al progresului
- Buton pentru generare subtasks (doar pentru premium)
- Opțiune de marcare task ca finalizat
- Opțiune de adăugare notițe personale
- Afișare resurse recomandate

**Subtask-uri (`app/(dashboard)/dashboard/roadmaps/[id]/subtasks/[subtaskId]/page.tsx`)**:
- Detalii complete pentru un subtask specific
- Resurse de învățare recomandate
- Checklist pentru subcomponente
- Buton pentru generare quiz pe subiectul respectiv
- Opțiune de marcare ca finalizat
- Note personale

### 5. Sistem de Quiz-uri

**Lista de Quiz-uri (`app/(dashboard)/dashboard/quizzes/page.tsx`)**:
- Grid cu toate quizurile disponibile
- Filtrare după categorie/domeniu
- Informații despre dificultate și număr de întrebări
- Sortare după relevantă pentru roadmap-ul curent

**Quiz Specific (`app/(dashboard)/dashboard/quizzes/[id]/page.tsx`)**:
- Interfață pentru desfășurarea quiz-ului
- Întrebări cu variante multiple sau răspuns deschis
- Timer opțional
- Feedback pentru răspunsuri
- Sumarizare rezultate la final
- Opțiune de regenerare quiz similar
- Acordare puncte de gamification pentru quiz completat

### 6. Sistem de Feedback

**Pagina de Feedback (`app/(dashboard)/dashboard/feedback/page.tsx`)**:
- Formular pentru trimitere feedback:
  - Titlu
  - Descriere
  - Categoria (bug, sugestie, întrebare)
  - Prioritate
  - Atașamente opționale
- Istoric feedback-uri trimise anterior
- Status pentru feedback-uri (în așteptare, în progres, rezolvat)

**Admin Feedback (`app/(dashboard)/admin/feedback/[id]/page.tsx`)**:
- Detalii complete feedback
- Opțiune de schimbare status
- Adăugare răspuns/comentarii
- Asignare către membri echipă
- Marcare prioritate

### 7. Sistem de Gamification

**Componente Principale (în `lib/gamification.ts`)**:
- Sistem de puncte:
  - Task-uri zilnice: 5 puncte
  - Completare subtask: 10 puncte
  - Completare roadmap: 50 puncte
  - Completare quiz cu scor bun: 15 puncte
  - Oferire feedback util: 5 puncte
  - Streak zilnic: 3 puncte
- Sistem de nivele:
  - Nivel 1: 0-100 puncte
  - Nivel 2: 101-200 puncte
  - Nivel 3: 201-350 puncte
  - Și așa mai departe, cu cerințe crescătoare
- Badge-uri:
  - `beginner-tutorial`: Badge "Newcomer" pentru completarea tutorialului
  - Badge-uri pentru completare roadmaps
  - Badge-uri pentru streak-uri (3, 7, 30, 100 zile)
  - Badge-uri pentru completare quizuri
  - Badge-uri premium exclusive

**GamificationDashboard (`components/shared/gamification/GamificationDashboard.tsx`)**:
- Afișare progres nivel curent
- Afișare badge-uri obținute
- Afișare activități recente
- Afișare streak zilnic
- Recompense disponibile

**BeginnerTutorial (`components/shared/BeginnerTutorial.tsx`)**:
- Tutorial modal pentru utilizatori noi
- Ghid pas cu pas pentru funcționalitățile de bază
- Acordare badge "Newcomer" și 20 puncte la finalizare
- Design spațios și organizat
- Dimensiune: 95% din lățimea ecranului, maxim 1200px
- Scroll vertical pentru conținut extins

### 8. Sistem Premium

**Pagina Premium (`app/(premium)/premium/page.tsx`)**:
- Prezentare beneficii Premium:
  - Generare nelimitată de roadmap-uri personalizate
  - Generare detalii pentru subtask-uri
  - Access la badge-uri premium și recompense exclusive
  - Analytics avansat și tracking progres
  - Suport prioritar și acces timpuriu la noi funcționalități
- Comparație Standard vs Premium:
  - Contul Standard (gratuit):
    - Poate începe roadmap-uri create de alții
    - Poate genera quizuri
    - Poate raporta probleme
    - Acces la funcțiile de bază de gamification
    - Obține badge-uri standard
  - Contul Premium:
    - Toate funcționalitățile Standard
    - Generare roadmap-uri personalizate
    - Generare detalii pentru subtask-uri
    - Acces la badge-uri premium
    - Analytics avansat și tracking progres
    - Suport prioritar
- Opțiuni de abonament:
  - Lunar: $9.99/lună
  - Anual: $99.99/an (economisire 16%)
- Procesare plăți prin Stripe

**Pagini de confirmare**:
- Success (`app/(premium)/premium/success/page.tsx`): Confirmare plată reușită
- Cancel (`app/(premium)/premium/cancel/page.tsx`): Anulare proces plată

### 9. Sistem Admin

**Dashboard Admin (`app/(dashboard)/admin/page.tsx`)**:
- Statistici generale utilizatori
- Feedback-uri recente
- Utilizatori activi
- Statistici premium/conversie

**Procesare Feedback (`app/(dashboard)/admin/feedback/[id]/page.tsx`)**:
- Vedere detaliată a feedback-ului
- Opțiuni de editare și răspuns
- Modificare status
- Asignare către membri echipă

## Detalii Tehnice

### Stack Tehnologic

- **Framework**: Next.js 13+ cu App Router
- **Stilizare**: Tailwind CSS și shadcn/ui
- **Backend**: Firebase (Firestore, Authentication)
- **Plăți**: Stripe
- **AI**: Integrare OpenAI API pentru generare conținut
- **State Management**: React Hooks și Context API
- **Deployment**: Vercel

### Integrări

1. **Firebase**:
   - Authentication pentru autentificare
   - Firestore pentru stocare date
   - Storage pentru fișiere și atașamente
   - Functions pentru logic avansată serverless

2. **Stripe**:
   - Procesare plăți abonamente
   - Webhook-uri pentru evenimente abonament
   - Portal client pentru gestionare abonament

3. **OpenAI API**:
   - Generare roadmap-uri personalizate
   - Generare conținut educațional
   - Generare întrebări quiz
   - Analiză și recomandări personalizate

## Flux de Lucru Utilizator

### Utilizator Nou

1. Utilizatorul accesează pagina principală
2. Se înregistrează cu email și parolă
3. Este redirecționat către dashboard
4. Este întâmpinat de tutorialul pentru începători
5. Completează tutorialul și primește badge-ul "Newcomer" și 20 puncte
6. Explorează roadmap-urile existente și începe unul
7. Generează un quiz pentru a testa cunoștințele

### Upgrade la Premium

1. Utilizatorul accesează pagina de profil sau primește prompt
2. Navighează la pagina Premium
3. Compară planurile și beneficiile
4. Selectează un plan (lunar sau anual)
5. Este redirecționat către Stripe pentru plată
6. După procesare, este redirecționat înapoi la aplicație
7. Primește confirmare și are acces la funcționalități premium

### Creare Roadmap (Premium)

1. Utilizatorul navighează la secțiunea Roadmaps
2. Accesează butonul Create New
3. Completează formularul cu detalii despre obiectivele de învățare
4. Generează roadmap-ul cu AI
5. Revizuiește și personalizează roadmap-ul
6. Salvează și începe să lucreze la roadmap

### Completare Quiz

1. Utilizatorul navighează la secțiunea Quizzes
2. Selectează un quiz relevant sau generează unul pentru un subtask
3. Completează quiz-ul răspunzând la întrebări
4. Primește feedback imediat pentru fiecare răspuns
5. La final, vede scorul și primește puncte de gamification
6. Are opțiunea de a regenera un quiz similar sau de a continua cu roadmap-ul

## Note de Design

- Toate paginile sunt în English, full screen
- Interfață intuitivă cu feedback vizual pentru acțiuni
- Animații subtile pentru tranziții și interacțiuni
- Compatibilitate responsive pentru toate dispozitivele
- Accesibilitate conformă cu standardele WCAG
- Tema dark mode cu accente de culoare pentru evidențierea elementelor importante
- Iconițe intuitive pentru funcționalități
- Mesaje clare pentru utilizator la fiecare acțiune 

## Best Practices & Documentații

### Next.js

- **Server și Client Components**: Folosirea corectă a server și client components conform [documentației Next.js](https://nextjs.org/docs):
  - Server Components pentru componente care nu necesită interactivitate
  - Client Components cu directiva `"use client"` pentru componente care necesită interactivitate
- **App Router**: Utilizarea noului App Router (directory-based routing)
- **Server Actions**: Pentru operațiuni server-side sigure
- **Static Site Generation (SSG)** și **Incremental Static Regeneration (ISR)** unde este posibil pentru performanță optimă
- **Image Optimization**: Utilizarea componentei `<Image>` pentru optimizarea automată a imaginilor
- **Font Optimization**: Încărcarea fonturilor conform recomandărilor Next.js
- **Metadata API**: Utilizarea API-ului de metadata pentru SEO
- **Error Boundaries**: Implementarea error boundaries pentru gestionarea erorilor la nivel de componente

### React

- **Hooks**: Utilizarea corectă a hooks conform [documentației React](https://react.dev/reference/react):
  - `useState` pentru state local
  - `useEffect` pentru side effects (cu dependency array corect)
  - `useContext` pentru state global
  - `useMemo` și `useCallback` pentru optimizări de performanță
- **Composition over Inheritance**: Preferarea compoziției față de moștenire
- **Lifting State Up**: Ridicarea state-ului la părintele comun cel mai apropiat
- **Single Responsibility**: Componente cu responsabilitate unică
- **Immutability**: Păstrarea imutabilității pentru state și props
- **Memoization**: Utilizarea `React.memo` pentru componente care primesc aceleași props frecvent

### Tailwind CSS

- **Responsive Design**: Utilizarea prefixelor responsive (`sm:`, `md:`, `lg:`)
- **Dark Mode**: Implementarea dark mode cu clase condiționale
- **Custom Classes**: Extinderea Tailwind prin configurarea `tailwind.config.js`
- **Organization**: Organizarea claselor după [convenția recomandată](https://tailwindcss.com/docs/functions-and-directives):
  - Layout
  - Spacing
  - Sizing
  - Typography
  - Visual (culori, umbre, etc.)
  - Interactive (hover, focus, etc.)

### Firebase

- **Security Rules**: Implementarea regulilor de securitate Firestore conform [best practices](https://firebase.google.com/docs/firestore/security/get-started)
- **Data Structure**: Structurarea datelor pentru queries eficiente:
  - Denormalizare strategică
  - Documente mici vs. colecții de subdocumente
- **Offline Capabilities**: Activarea capacităților offline
- **Batch Operations**: Utilizarea operațiunilor batch pentru actualizări multiple
- **Authentication**: Implementarea autentificării cu metodele recomandate

### Stripe

- **Elements**: Utilizarea Stripe Elements pentru formulare de plată
- **Payment Intents API**: Implementarea API-ului Payment Intents pentru procesări conforme cu SCA
- **Webhooks**: Configurarea corectă a webhook-urilor pentru evenimente de plată
- **Customer Portal**: Utilizarea portalului pentru clienți pentru gestionarea abonamentelor
- **Testing**: Utilizarea cheilor de test și a cardurilor de test în dezvoltare

### Optimizări pentru Vercel Deployment

- **Environment Variables**: Configurarea corectă a variabilelor de mediu în dashboard-ul Vercel
- **Preview Deployments**: Utilizarea preview deployments pentru ramuri de feature/bugfix
- **Edge Functions**: Utilizarea Edge Functions pentru performanță globală
- **Serverless Functions**: Optimizarea serverless functions:
  - Cold starts minime
  - Bundle size redus
- **Analytics**: Activarea Vercel Analytics pentru monitorizarea performanței
- **Edge Middleware**: Utilizarea middleware pentru autentificare și redirecționări la edge
- **Content Delivery**: Utilizarea opțiunilor de caching și CDN din Vercel
- **Monorepo Support**: Configurarea corectă a proiectelor monorepo
- **Domain Management**: Configurarea și securizarea domeniilor custom

### Performance Optimization

- **Code Splitting**: Împărțirea codului pentru încărcare lazy
- **Tree Shaking**: Eliminarea codului neutilizat
- **Dynamic Imports**: Importuri dinamice pentru componente mari
- **Web Vitals**: Monitorizarea și optimizarea pentru Core Web Vitals:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
- **SEO**: Implementarea meta tags, OpenGraph, și JSON-LD
- **Accessibility**: Respectarea standardelor WCAG 2.1
- **Optimizarea imaginilor**: Formate moderne (WebP, AVIF), dimensiuni optime

### Testing și Quality Assurance

- **Unit Testing**: Jest/React Testing Library
- **E2E Testing**: Cypress/Playwright
- **Continuous Integration**: Integrare cu GitHub Actions
- **Linting**: ESLint cu configurații recomandate
- **Type Safety**: TypeScript strict mode
- **Code Quality**: Utilizarea SonarQube sau alte instrumente de analiză statică

### Security

- **Authentication**: Implementarea autentificării securizate
- **Authorization**: Verificarea permisiunilor pentru fiecare acțiune
- **Input Validation**: Validarea tuturor input-urilor utilizatorilor
- **XSS Protection**: Protecție împotriva atacurilor Cross-Site Scripting
- **CSRF Protection**: Protecție împotriva atacurilor Cross-Site Request Forgery
- **Content Security Policy**: Implementarea politicilor de securitate a conținutului
- **Rate Limiting**: Limitarea ratei de request-uri pentru prevenirea abuzurilor

### Documentații Oficiale

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 

## Configurație Proiect

### Variabile de Mediu (.env)

Fișierul `.env.local` trebuie configurat cu următoarele variabile de mediu:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=your_stripe_monthly_price_id
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=your_stripe_yearly_price_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_openai_organization

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (optional)
EMAIL_SERVER_USER=your_email_server_user
EMAIL_SERVER_PASSWORD=your_email_server_password
EMAIL_SERVER_HOST=your_email_server_host
EMAIL_SERVER_PORT=your_email_server_port
EMAIL_FROM=your_email_from_address
```

**Importante:**
- Pentru deployment pe Vercel, configurați aceste variabile în dashboard-ul Vercel
- Toate variabilele prefixate cu `NEXT_PUBLIC_` sunt accesibile în client-side, restul sunt doar pentru server-side
- Păstrați aceste chei secrete și nu le includeți niciodată în repository
- Pentru dezvoltare locală, creați un fișier `.env.local` care nu va fi comis în Git

### Configurare Firebase (firebase.ts)

Fișierul `lib/firebase.ts` conține configurarea Firebase pentru întreaga aplicație:

```typescript
// lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inițializează Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Setează emulatorii pentru dezvoltare locală dacă este necesar
if (process.env.NODE_ENV === 'development') {
  // Decomentați și ajustați următoarele linii pentru a folosi emulatorii Firebase
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectStorageEmulator(storage, 'localhost', 9199);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app, db, auth, storage, functions };
``` 

## Responsive Design & Accesibilitate

### Responsive Design

Aplicația trebuie să fie complet responsivă, cu experiență optimă pe toate dispozitivele. Implementarea responsivă va urma următoarele principii:

- **Mobile-First Approach**: Dezvoltarea începe cu design pentru mobile, apoi se extinde pentru ecrane mai mari
- **Breakpoints consistente** în întreaga aplicație:
  - `sm`: 640px (telefoane în modul landscape)
  - `md`: 768px (tablete)
  - `lg`: 1024px (laptop-uri/desktop-uri mici)
  - `xl`: 1280px (desktop-uri)
  - `2xl`: 1536px (ecrane mari)

- **Layout Adaptiv**:
  - Sistem de grid flexibil pentru aranjarea componentelor
  - Utilizarea `flex` și `grid` pentru layout-uri adaptabile
  - Stacking vertical pe mobile, layout-uri mai complexe pe desktop
  - Evitarea valorilor fixe pentru width/height în favoarea unităților relative (%, vh, vw, rem)

- **Componente Responsive**:
  - Cards care se redimensionează fluent
  - Tabele cu scroll orizontal pe mobile
  - Navbar colapsabil pe mobile cu burger menu
  - Sidebar care devine drawer pe ecrane mici
  - Formulare optimizate pentru touch input

- **Imagini și Media Responsive**:
  - Utilizarea `next/image` cu dimensiuni responsive
  - Art direction pentru imagini diferite pe dimensiuni diferite de ecran
  - `object-fit: cover` pentru păstrarea raportului de aspect

- **Typography Responsive**:
  - Font size scalabil bazat pe viewport
  - Line-height optimizat pentru lizibilitate
  - Headings care se ajustează proporțional cu dimensiunea ecranului

- **Testing pe Multiple Dispozitive**:
  - Testare pe telefoane, tablete, laptop-uri, desktop-uri
  - Compatibilitate încrucișată browser (Chrome, Safari, Firefox, Edge)
  - Emulare device în browser tools pentru testare rapidă

### Standardizare Lingvistică - English Only

Întreaga aplicație trebuie dezvoltată exclusiv în limba engleză pentru a asigura consistența și accesibilitatea globală:

- **UI/UX Text**:
  - Toate textele din interfață (butoane, meniuri, etichete, placeholder-uri, etc.) trebuie să fie în engleză
  - Terminologie consecventă în toată aplicația (ex: folosiți întotdeauna "Sign in" nu alternativ "Login")
  - Mesaje de eroare și succes în engleză clară și concisă

- **Documentație & Comentarii**:
  - Comentariile din cod în engleză
  - Numele variabilelor și funcțiilor în engleză
  - Documentația API și ghiduri în engleză

- **Conținut Generat**:
  - Toate prompt-urile către OpenAI configurate pentru a genera răspunsuri în engleză
  - Roadmap-uri, quiz-uri și alte conținuturi generate automatizat în engleză

- **Date și Ore**:
  - Format internațional pentru date (YYYY-MM-DD)
  - Format de 24 de ore sau includerea AM/PM pentru claritate
  - Utilizarea bibliotecii date-fns cu locale setat la 'en-US' sau 'en-GB'

- **Comunicare cu Utilizatorul**:
  - Toate notificările în engleză
  - Emailurile transacționale și de marketing în engleză
  - Termeni și condiții, politica de confidențialitate în engleză

Această abordare asigură că aplicația este accesibilă la nivel global și simplifică mentenanța și dezvoltarea ulterioară. 

## Funcționalități Adiționale

### 1. Sistem de Notificări Complet

**Implementare**:
- **Notificări în aplicație**: Popup-uri și badge-uri pentru evenimente importante
  - Finalizare task-uri
  - Atribuire badge-uri noi
  - Atingere obiective
  - Răspunsuri la feedback
- **Notificări prin email**:
  - Rezumate săptămânale de progres
  - Roadmap-uri noi disponibile
  - Răspunsuri la feedback
  - Memento-uri pentru continuarea învățării
- **Centru de notificări**:
  - Istoric al tuturor notificărilor
  - Opțiuni de filtrare (citite/necitite)
  - Marcare în masă ca citite

**Arhitectură**:
- Sistem de evenimente pentru declanșarea notificărilor
- Queue pentru procesarea notificărilor în masă
- Template-uri personalizabile pentru diferite tipuri de notificări
- Preferințe de notificare per utilizator și per tip de eveniment

### 2. Sistem de Căutare Global

**Implementare**:
- **Bara de căutare omniprezentă** în header
- **Căutare indexată** în:
  - Roadmap-uri
  - Subtask-uri
  - Quiz-uri
  - Resurse de învățare
  - Badge-uri
- **Filtre avansate**:
  - După categorie
  - După nivel de dificultate
  - După popularitate
  - După relevanță pentru obiectivele utilizatorului
- **Sugestii inteligente**:
  - Sugestii în timp real
  - Corectarea greșelilor de ortografie
  - Sugestii bazate pe istoricul de căutare și interese

**Tehnologie**:
- Implementare cu Algolia sau ElasticSearch
- Căutare server-side pentru rezultate precise
- Caching pentru interogări frecvente

### 3. Comunitate și Colaborare

**Caracteristici**:
- **Partajare roadmap-uri**:
  - Opțiune de a face roadmap-urile publice
  - Clonare roadmap-uri din biblioteca publică
  - Recomandări de roadmap-uri populare
- **Comentarii și evaluări**:
  - Posibilitatea de a comenta pe roadmap-uri publice
  - Sistem de rating pentru roadmap-uri și resurse
  - Reacții cu emoji pentru feedback rapid
- **Spațiu comunitar**:
  - Forum organizat pe categorii de învățare
  - Posibilitatea de a pune întrebări și de a primi răspunsuri
  - Secțiuni pentru partajare de resurse

**Moderare**:
- Raportare conținut neadecvat
- Sistem de reputație pentru utilizatori activi
- Roluri de comunitate (contributor, expert, moderator)

### 4. Pagină de Ajutor și Documentație

**Componente**:
- **Centru de ajutor complet**:
  - Organizat pe categorii și subcategorii
  - Căutare dedicată în documentație
- **FAQ extensiv**:
  - Întrebări frecvente și răspunsuri detaliate
  - Organizate pe teme
- **Ghiduri interactive**:
  - Tutorial-uri pas cu pas pentru fiecare funcționalitate
  - Ghiduri video pentru concepte mai complexe
- **Contactare suport**:
  - Formular de contact direct din pagina de ajutor
  - Chat de suport pentru utilizatori premium

**Structură**:
- Navigare intuitivă cu breadcrumbs
- Design responsiv pentru toate dispozitivele
- Articole actualizate regulat bazate pe feedback-ul utilizatorilor

### 5. Statistici și Analiză Avansată

**Dashboard-uri analitice**:
- **Progres general**:
  - Vizualizare timeline a progresului
  - Analiză a timpului petrecut pe diferite subiecte
  - Heatmap al activității zilnice/săptămânale
- **Analiză performanță quiz-uri**:
  - Scoruri per categorie
  - Identificarea domeniilor de îmbunătățit
  - Comparație cu media utilizatorilor
- **Prognoze și recomandări**:
  - Predicții pentru finalizarea roadmap-urilor
  - Sugestii personalizate bazate pe activitate
  - Identificarea gap-urilor de competențe

**Export și rapoarte**:
- Generare rapoarte PDF pentru utilizatori premium
- Export de date în formate comune (CSV, JSON)
- Dashboard-uri personalizabile

## Tipuri de Utilizatori și Capabilități

### Utilizator Standard (Gratuit)

**Acces și Limitări**:
- **Roadmap-uri**:
  - Poate accesa și utiliza roadmap-uri create de alții
  - Poate vedea roadmap-uri din biblioteca publică
  - **Nu poate genera** roadmap-uri personalizate cu AI
  - Limitat la 3 roadmap-uri active simultan
  - **Nu poate genera** detalii pentru subtask-uri
- **Quiz-uri**:
  - Poate genera până la 5 quiz-uri pe săptămână
  - Acces la quiz-uri de dificultate de bază și intermediară
  - Poate exporta rezultatele quiz-urilor
- **Gamification**:
  - Acces complet la sistemul de puncte și nivele
  - Poate obține badge-uri standard
  - **Nu are acces** la badge-uri premium și exclusive
  - Streak zilnic și recompense de bază
- **Social și comunitate**:
  - Poate comenta pe roadmap-uri publice
  - Acces la forumul comunității
  - **Nu poate** crea roadmap-uri publice
- **Suport**:
  - Acces la documentație și FAQ
  - Suport prin email cu timp de răspuns standard (2-3 zile)
  - **Nu are** acces la suport prioritar

**Zilnic, un utilizator standard poate**:
1. Progresa prin roadmap-urile existente
2. Marca task-uri ca finalizate
3. Crea un număr limitat de quiz-uri pentru testarea cunoștințelor
4. Acumula puncte și badge-uri standard
5. Interacționa cu comunitatea prin comentarii
6. Raporta bug-uri sau probleme

### Utilizator Premium (Plătit)

**Beneficii și Capabilități**:
- **Roadmap-uri**:
  - Generare **nelimitată** de roadmap-uri personalizate cu AI
  - Acces la generarea detaliată a subtask-urilor
  - Număr nelimitat de roadmap-uri active
  - Prioritate în procesarea AI
  - Acces la template-uri avansate
- **Quiz-uri**:
  - Generare **nelimitată** de quiz-uri
  - Acces la toate nivelurile de dificultate
  - Quiz-uri adaptative care se ajustează la nivelul de competență
  - Generare de quiz-uri specializate pe domenii specifice
- **Gamification**:
  - Acces la **toate** badge-urile, inclusiv cele exclusive
  - Multiplicatori de puncte pentru activități consecutive
  - Recompense premium pentru realizări
  - Dashboard avansat de statistici și progres
- **Social și comunitate**:
  - Poate crea și publica roadmap-uri 
  - Profiluri premium evidențiate în comunitate
  - Acces la grupuri exclusive de utilizatori premium
- **Analiză și rapoarte**:
  - Rapoarte detaliate de progres săptămânal/lunar
  - Analiză comparativă cu alți utilizatori
  - Insight-uri personalizate bazate pe comportament
  - Export date în formate multiple
- **Suport**:
  - Suport prioritar cu timp de răspuns garantat (24h)
  - Acces la sesiuni 1:1 de onboarding (pentru planul anual)
  - Acces timpuriu la noi funcționalități

**Zilnic, un utilizator premium poate**:
1. Genera roadmap-uri personalizate bazate pe obiective specifice
2. Obține detalii aprofundate pentru fiecare task de învățare
3. Crea quiz-uri nelimitate adaptate la nivelul de competență
4. Accesa analize avansate ale progresului
5. Obține badge-uri exclusive și recompense premium
6. Beneficia de suport prioritar pentru orice problemă
7. Contribui activ în comunitate prin roadmap-uri și resurse publicate 

## Arhitectură Code & Componentizare

### Principii de Cod Reutilizabil

**Design Patterns & Structură**:
- **Component-Driven Development**: Dezvoltarea aplicației pornind de la componente mici, independente
- **Atomic Design**: Organizarea componentelor pe nivele:
  - Atomi: butoane, input-uri, iconițe, etc.
  - Molecule: grupuri de atomi care funcționează împreună (ex: card, form field)
  - Organisme: grupuri mai complexe de molecule (ex: navigation, search section)
  - Template-uri: aranjamente de organisme care formează pagini
  - Pagini: instanțe specifice de template-uri

**Organizare**:
- **Folder Structure** organizată pe funcționalități:
  ```
  components/
  ├── ui/ - Componente de bază refolosibile
  │   ├── Button/
  │   │   ├── index.tsx
  │   │   ├── Button.tsx
  │   │   └── Button.test.tsx
  │   ├── Card/
  │   ├── Input/
  │   └── ...
  ├── common/ - Componente folosite în întreaga aplicație
  │   ├── Header/
  │   ├── Footer/
  │   ├── Sidebar/
  │   └── ...
  ├── features/ - Componente specifice pentru funcționalități
  │   ├── roadmaps/
  │   ├── quizzes/
  │   ├── gamification/
  │   └── ...
  └── layouts/ - Layout-uri pentru diferite pagini
      ├── DashboardLayout/
      ├── AuthLayout/
      └── ...
  ```

- **Custom Hooks**: Extragerea logicii reutilizabile în hooks specializate:
  ```typescript
  // hooks/useRoadmap.ts
  export function useRoadmap(roadmapId: string) {
    // Logică pentru fetching și manipulare roadmap
    return {
      roadmap,
      isLoading,
      error,
      updateRoadmap,
      deleteRoadmap,
      // ...etc
    };
  }
  ```

- **Context API**: Utilizarea Context pentru stare globală organizată pe domenii:
  ```typescript
  // contexts/UserContext.tsx
  export const UserContext = createContext<UserContextType | undefined>(undefined);

  export function UserProvider({ children }: { children: React.ReactNode }) {
    // Implementarea state management-ului pentru user
    return <UserContext.Provider value={...}>{children}</UserContext.Provider>;
  }
  ```

### Componente Reutilizabile

**UI Components**:
- **Button Component**: Reutilizabil cu variante, size, și state:
  ```tsx
  <Button 
    variant="primary" 
    size="md" 
    isLoading={isSubmitting}
    onClick={handleSubmit}
  >
    Submit
  </Button>
  ```

- **Card Component**: Flexibil pentru diferite use cases:
  ```tsx
  <Card>
    <CardHeader>
      <CardTitle>Roadmap Title</CardTitle>
      <CardDescription>Short description</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
  ```

- **Form Components**: Consistente și reutilizabile:
  ```tsx
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="email@example.com" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  ```

**Complex Components**:
- **RoadmapCard**: Pentru afișarea roadmap-urilor:
  ```tsx
  <RoadmapCard 
    roadmap={roadmapData}
    onView={() => router.push(`/dashboard/roadmaps/${roadmap.id}`)}
    onEdit={canEdit ? handleEdit : undefined}
    progress={60}
  />
  ```

- **QuizQuestion**: Pentru afișarea unei întrebări de quiz:
  ```tsx
  <QuizQuestion
    question={currentQuestion}
    onAnswer={handleAnswer}
    timeLeft={timeRemaining}
    isLastQuestion={isLast}
  />
  ```

- **ProgressTracker**: Pentru afișarea progresului:
  ```tsx
  <ProgressTracker
    current={currentStep}
    total={totalSteps}
    labels={stepLabels}
    onStepClick={canNavigate ? handleStepClick : undefined}
  />
  ```

### Utilitare & Helper Functions

**Utility Functions**:
- Funcții pure pentru validare, formatare, transformări
- Exportate din fișiere dedicate pentru reutilizare
- Testate individual

```typescript
// utils/string.ts
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

// utils/date.ts
export function formatDateRelative(date: Date): string {
  // Logică pentru formatare relativă (e.g. "2 days ago")
}
```

**Services**: Abstractizări pentru interacțiuni cu API-uri și servicii externe:
```typescript
// services/roadmaps.ts
export async function fetchRoadmaps(filters: RoadmapFilters): Promise<Roadmap[]> {
  // Implementare
}

export async function createRoadmap(data: RoadmapInput): Promise<Roadmap> {
  // Implementare
}
```

### Componentizare Specifică Aplicației

**Gamification Components**:
- **BadgeDisplay**: Pentru afișarea badge-urilor utilizatorului
- **PointsCounter**: Afișare și animare puncte
- **LevelProgressBar**: Vizualizare progres către nivelul următor
- **StreakIndicator**: Afișare streak curent

**Roadmap Components**:
- **RoadmapGraph**: Vizualizare grafică a unui roadmap
- **TaskList**: Listă de task-uri cu status
- **ResourceLink**: Component pentru afișarea resurselor
- **SubtaskExpander**: Expandare/colapsare subtask-uri

**Quiz Components**:
- **MultipleChoiceQuestion**: Întrebare cu variante multiple
- **OpenEndedQuestion**: Întrebare cu răspuns deschis
- **QuizTimer**: Timer pentru quiz-uri
- **ResultsSummary**: Sumarizare rezultate quiz

### State Management

**Principii de State Management**:
- **Localizarea State-ului**: State cât mai aproape de unde e folosit
- **Lifting State Up**: Ridicarea state-ului doar când e necesar
- **Global State**: Doar pentru state care este:
  - Folosit în multe locuri din aplicație
  - Persistent între navigări
  - Dependent de alte state-uri globale

**Implementare**:
- **React Context** pentru state de aplicație:
  - UserContext: informații utilizator, autentificare
  - PreferencesContext: preferințe utilizator
  - NotificationsContext: gestionare notificări
- **Component State** pentru state UI local

### Code Splitting & Lazy Loading

**Optimizarea Bundle Size**:
- **Dynamic Imports**: Importuri dinamice pentru componente mari:
  ```tsx
  const RoadmapEditor = dynamic(() => import('@/components/features/roadmaps/RoadmapEditor'), {
    loading: () => <LoadingSpinner />,
    ssr: false
  });
  ```

- **Route-Based Splitting**: Code splitting bazat pe rute

**Suspense & Lazy Loading**:
- Utilizarea React.Suspense pentru loading state:
  ```tsx
  <Suspense fallback={<LoadingSkeleton />}>
    <ComplexDataComponent />
  </Suspense>
  ```

### Documentation & Testing

**Component Documentation**:
- Comentarii JSDoc pentru componente și funcții:
  ```tsx
  /**
   * Displays a roadmap card with progress and actions
   * @param roadmap - The roadmap data to display
   * @param onView - Callback when the view action is clicked
   * @param onEdit - Callback when the edit action is clicked (optional)
   * @param progress - Current progress percentage (0-100)
   */
  export function RoadmapCard({ roadmap, onView, onEdit, progress }: RoadmapCardProps) {
    // Implementation
  }
  ```

**Testing**:
- Unit tests pentru componente izolate
- Integration tests pentru componente compuse
- E2E tests pentru fluxuri complete

**Convenții de Cod**:
- TypeScript strict mode
- ESLint cu reguli pentru a asigura consistența
- Prettier pentru formatare consistentă
- Husky pre-commit hooks pentru validare

### Principii de Modularizare

- **Single Responsibility**: Fiecare componentă are un scop unic și clar
- **Interface Segregation**: Componente cu props minimale și specializate
- **Dependency Inversion**: Folosirea de abstractizări și injection pentru servicii și API-uri
- **Composition Over Inheritance**: Preferarea compoziției de componente în locul moștenirii
- **DRY (Don't Repeat Yourself)**: Extragerea codului duplicat în componente și utilități reutilizabile 