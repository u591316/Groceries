# Huskel

En liten Next.js-app for delt handleliste med Firebase Firestore som backend.

## Stack

- Next.js 15
- React 19
- Firebase Auth (anonymous)
- Firestore
- PWA via `next-pwa`

## Krav

- Node.js 20 eller nyere
- `npm`
- Et Firebase-prosjekt med Firestore og Anonymous Auth aktivert

## Miljovariabler

Opprett lokal env-fil:

```bash
cp .env.example .env.local
```

Innhold:

```bash
NEXT_PUBLIC_LIST_ID=huskel-lista
```

`NEXT_PUBLIC_LIST_ID` er id-en for den delte lista. Alle som skal se samme data ma bruke samme verdi.

## Forstegangsoppsett

1. Installer dependencies:

```bash
npm install
```

2. Aktiver `Anonymous` i Firebase Console:
   `Authentication -> Sign-in method -> Anonymous`

3. Publiser Firestore-reglene fra prosjektet:

```bash
npm i -g firebase-tools
firebase login
firebase use groceries-90029
firebase deploy --only firestore:rules
```

Hvis du ikke vil bruke CLI kan du lime inn innholdet fra `firestore.rules` manuelt i Firebase Console under `Firestore Database -> Rules`.

## Kjor lokalt

Start dev-server:

```bash
npm run dev
```

Appen blir tilgjengelig pa [http://localhost:3000](http://localhost:3000).

## Bygg for produksjon

```bash
npm run build
```

For aa starte produksjonsbygget lokalt:

```bash
npm run start
```

## Kvalitetssjekker

Prosjektet har ikke egne automatiserte tester enda. Dette er kommandoene som brukes som sjekk i dag:

Lint:

```bash
npm run lint
```

TypeScript-sjekk:

```bash
npx tsc --noEmit
```

Anbefalt sjekkrutine for en endring:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Datamodell

Firestore bruker disse stiene:

- `lists/{LIST_ID}/tabs`
- `lists/{LIST_ID}/items`

Standardfanen har id `default` og kan ikke slettes. Andre faner kan opprettes og slettes i UI-et.

## Deploy

Prosjektet er satt opp for Vercel.

Det viktigste i produksjon:

- `NEXT_PUBLIC_LIST_ID` ma settes i Vercel under `Settings -> Environment Variables`
- Firestore-reglene ma vaere publisert
- Firebase Anonymous Auth ma vaere aktivert

Ved deploy fra Git bygger Vercel normalt automatisk når du pusher til production-branchen.

## Nyttige filer

- `src/app/page.tsx`: hoved-UI
- `src/app/useShoppingList.ts`: Firebase-logikk, tabs og items
- `src/app/manifest.ts`: PWA-manifest
- `firestore.rules`: Firestore security rules
- `src/app/firebase.ts`: Firebase-klientoppsett
