# Configurarea Firebase Admin SDK

Acest document explică cum să configurezi și să utilizezi Firebase Admin SDK în aplicația Next.js pentru a gestiona baza de cunoștințe și pentru a implementa funcționalități administrative securizate.

## Ce este Firebase Admin SDK?

Firebase Admin SDK oferă acces privilegiat la serviciile Firebase din partea serverului. Spre deosebire de SDK-ul client, care rulează în browser, Admin SDK rulează pe server și poate:

- Gestiona utilizatori (creare, ștergere, modificare)
- Accesa Firestore fără restricțiile regulilor de securitate
- Verifica tokeni JWT
- Gestiona claim-uri personalizate pentru utilizatori
- Trimite notificări push
- Și multe altele

## Configurare

### 1. Obținerea cheii private pentru serviciul Firebase

1. Accesează [Consola Firebase](https://console.firebase.google.com/)
2. Selectează proiectul tău
3. Navighează la **Setări proiect** > **Conturi de serviciu**
4. Selectează **Node.js** și apasă pe **Generare cheie privată nouă**
5. Salvează fișierul JSON generat (NU îl adăuga niciodată în controlul versiunii)

### 2. Configurarea variabilelor de mediu

Adaugă următoarele variabile în fișierul `.env.local`:

```
# Firebase Admin SDK
FIREBASE_PROJECT_ID=project-id-din-fisierul-json
FIREBASE_CLIENT_EMAIL=client-email-din-fisierul-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** Asigură-te că pentru `FIREBASE_PRIVATE_KEY` păstrezi caracterele newline (`\n`).

### 3. Instalarea pachetelor necesare

Asigură-te că ai instalat pachetele necesare:

```bash
npm install firebase-admin
```

## Utilizare

### Autentificare și verificare token

```typescript
import { authAdmin, verifyIdToken } from '@/lib/firebaseAdmin';

// Verifică un token JWT
const decodedToken = await verifyIdToken(token);
const userId = decodedToken.uid;

// Obține informații despre un utilizator
const userRecord = await authAdmin.getUser(userId);
```

### Operații Firestore

```typescript
import { dbAdmin } from '@/lib/firebaseAdmin';

// Adaugă un document
const docRef = await dbAdmin.collection('knowledge_base').add({
  title: 'Titlu document',
  content: 'Conținut document',
  createdAt: new Date().toISOString()
});

// Obține un document
const docSnapshot = await dbAdmin.collection('knowledge_base').doc(docId).get();
const docData = docSnapshot.data();

// Actualizează un document
await dbAdmin.collection('knowledge_base').doc(docId).update({
  title: 'Titlu actualizat',
  updatedAt: new Date().toISOString()
});

// Șterge un document
await dbAdmin.collection('knowledge_base').doc(docId).delete();
```

### Managementul utilizatorilor și rolurilor

Utilizează funcțiile din `lib/adminUtils.ts` pentru:

```typescript
import { setUserRole, checkUserPermissions, getAdminUsers } from '@/lib/adminUtils';

// Setează rolul unui utilizator
await setUserRole(userId, 'admin', ['manage_users', 'edit_knowledge_base']);

// Verifică permisiunile unui utilizator
const { hasAccess } = await checkUserPermissions(userId, ['edit_knowledge_base']);

// Obține toți utilizatorii cu rol de admin
const adminUsers = await getAdminUsers();
```

## Bune practici

1. **Securitate**: Nu expune niciodată credențialele Firebase Admin în client. Utilizează Firebase Admin SDK doar în route handlers, API routes sau în middleware.

2. **Performanță**: Firebase Admin SDK inițializează o conexiune care poate fi refolosită. Asigură-te că inițializezi SDK-ul o singură dată folosind pattern-ul singleton.

3. **Erori**: Tratează întotdeauna erorile și oferă răspunsuri adecvate.

4. **Validare**: Validează întotdeauna datele de intrare înainte de a efectua operații.

5. **Roluri și permisiuni**: Implementează un sistem de roluri și permisiuni pentru a controla accesul la date.

6. **Audit**: Păstrează un jurnal de audit pentru operațiile administrative importante.

## Configurare în producție

În producție, configurează variabilele de mediu în platforma de hosting (Vercel, Netlify, etc.) și asigură-te că nu există scurgeri de informații sensibile.

Pentru mai multe informații, consultă [documentația oficială Firebase Admin SDK](https://firebase.google.com/docs/admin/setup). 