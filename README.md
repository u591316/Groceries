# Huskel (felles handleliste)

Dette prosjektet er en Next.js-app som bruker Firebase Firestore.

## Hva som var feil

Firestore i testmodus slår seg ofte av etter en periode, og da får appen `permission-denied`.

## Hva som er fikset i koden

- Appen logger inn med Firebase Anonymous Auth automatisk.
- Data ligger nå i `lists/{LIST_ID}/items` (delt liste).
- Brukervennlige feilmeldinger vises i UI ved manglende tilgang.
- Firestore-regler ligger i `firestore.rules`.

## 1) Lag lokal env-fil

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_LIST_ID` må være samme verdi på begge telefoner, f.eks. `huskel-lista`.

## 2) Aktiver Firebase Anonymous Auth

I Firebase Console for prosjektet `groceries-90029`:

1. Gå til `Authentication`.
2. Gå til `Sign-in method`.
3. Aktiver `Anonymous`.

## 3) Publiser Firestore-regler

### Alternativ A: Firebase Console

1. Gå til `Firestore Database` -> `Rules`.
2. Lim inn innholdet fra `firestore.rules`.
3. Trykk `Publish`.

### Alternativ B: Firebase CLI

```bash
npm i -g firebase-tools
firebase login
firebase use groceries-90029
firebase deploy --only firestore:rules
```

## 4) Kjør lokalt

```bash
npm install
npm run dev
```

Åpne `http://localhost:3000`.

## 5) Deploy

Deploy samme kodebase som huskel.app peker på (f.eks. Vercel). Begge enheter må bruke samme deploy + samme `NEXT_PUBLIC_LIST_ID`.
