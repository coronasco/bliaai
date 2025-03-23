# Documentație Blia AI - Platforma de învățare personalizată

## Prezentare generală a aplicației

Blia AI este o platformă de învățare personalizată care utilizează inteligența artificială pentru a crea trasee educaționale personalizate pentru utilizatori în funcție de obiectivele lor de carieră. Aplicația oferă:

- Generarea de trasee de învățare (roadmaps) personalizate bazate pe obiective de carieră
- Salvarea și urmărirea progresului în trasee educaționale
- Colecție de căi de învățare (paths) specializate pentru diverse competențe
- Funcționalități de utilizare offline prin salvare locală a datelor
- Sistem de niveluri și puncte pentru gamificarea experienței

## Arhitectura aplicației

Aplicația este construită folosind:

- **Frontend**: Next.js (App Router), React, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: OpenAI API pentru generarea conținutului personalizat
- **State Management**: React Hooks
- **Styling**: TailwindCSS cu shadcn/ui components

## Structura proiectului

```
├── app/                    # Structura Next.js App Router
│   ├── (auth)/             # Pagini pentru autentificare
│   ├── (dashboard)/        # Pagini pentru dashboard și funcționalități principale
│   ├── api/                # Route-uri API pentru server-side logic
│   └── paths/              # Căi educaționale
├── components/
│   ├── shared/             # Componente comune reutilizabile
│   └── ui/                 # Componente UI de bază (shadcn)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilități, configurații și tipuri
├── public/                 # Resurse statice
└── styles/                 # Stiluri globale
```

## Componente Principale

### CareerRoadmap

Componenta principală pentru afișarea și interacțiunea cu roadmap-urile de carieră. Gestionează:
- Afișarea secțiunilor și sub-sarcinilor
- Navigarea prin etapele de învățare
- Expandarea/colapsarea secțiunilor
- Interacțiunea cu secțiunile și marcarea ca finalizate

### PathCard

Componentă reutilizabilă pentru afișarea căilor educaționale (paths) care arată:
- Informații despre calea educațională (titlu, descriere, categorie)
- Statistici (aprecieri, număr de finalizări)
- Indicatori vizuali (completat, salvat)

### CareerCreationModal

Dialog interactiv pentru crearea unui traseu de carieră personalizat cu:
- Formular pentru detaliile carierei dorite 
- Vizualizare a progresului în timp real
- Indicatori de generare AI

## Fluxuri principale de utilizare

### Generarea unui traseu de carieră personalizat

1. Utilizatorul completează formularul de creare roadmap cu detalii despre cariera dorită
2. Aplicația procesează datele și generează un roadmap personalizat prin API-ul AI
3. Roadmap-ul este salvat atât în Firebase cât și în localStorage pentru utilizare offline
4. Utilizatorul poate vizualiza și interacționa cu roadmap-ul generat

### Salvarea și sincronizarea datelor

Aplicația implementează un sistem robust de persistență a datelor care:
- Salvează automat roadmap-urile în localStorage
- Sincronizează datele cu Firebase când conexiunea este disponibilă
- Oferă backup-uri locale pentru a preveni pierderea datelor
- Permite restaurarea din backup-uri în caz de corupere a datelor

### Mecanismul de recuperare de erori

Aplicația are implementat un mecanism de recuperare pentru cazuri când:
- Datele roadmap-ului sunt invalide sau corupte
- Conexiunea la Firebase nu este disponibilă
- Utilizatorul este offline

## Tipuri de date principale

### RoadmapType

```typescript
type RoadmapType = {
  id: string;
  title: string;
  sections: {
    title: string;
    progress: number;
    subsections: {
      title: string;
      completed: boolean;
      relatedPathId?: string;
    }[];
  }[];
  requiredSkills?: string[];
};
```

### PathType

```typescript
type PathType = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationHours: number;
  likes: number;
  completedBy: number;
};
```

## Extensibilitate

Arhitectura aplicației permite extinderea facilă prin:
- Adăugarea de noi componente în directorul `shared/`
- Extinderea API-urilor în directorul `api/`
- Îmbunătățirea fiecărui flux prin modulele existente

## Securitate și optimizări

- Verificări stricte ale datelor pentru a evita erori cu date invalide
- Salvarea locală a datelor pentru funcționalitate offline
- Backup de date pentru prevenirea pierderii informațiilor
- Verificări de permisiuni în Firebase pentru accesul la date
- Rate limiting pentru apelurile API 