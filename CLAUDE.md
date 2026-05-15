# CLAUDE.md — Guide de migration PokéGames

Ce fichier sert de référence pour tout nouveau chat reprenant la migration.
Lis-le entièrement avant de modifier quoi que ce soit.

---

## Vue d'ensemble du projet

**PokéGames** est une application web de mini-jeux Pokémon.
Le joueur devine des Pokémon à partir d'indices, de descriptions, ou d'autres mécaniques.

**Migration en cours** : Blazor Server → React + ASP.NET Core Web API séparés.

---

## Architecture

```
PokeGamesV0/                     ← repo Git principal
├── PokéDesc.API/                ← Web API ASP.NET Core 8
│   └── Data/                   ← Fichiers JSON statiques (all_pokemon.json, all_types.json)
├── PokéDesc.Business/           ← Logique métier (Services, Interfaces)
├── PokéDesc.Data/               ← Repositories (lecture JSON en mémoire)
├── PokéDesc.Domain/             ← Modèles (Pokemon, Partie, etc.)
├── Projet_FullStack_FrontEnd/   ← ANCIEN frontend Blazor (référence uniquement)
├── FrontEnd/                    ← NOUVEAU frontend React (en cours)
├── Dockerfile.backend
├── docker-compose.yml           ← Docker mis en pause, à reprendre plus tard
└── .env.example
```

Le dossier `FrontEnd/` a vocation à être extrait dans un **repo séparé** plus tard.

---

## Stack technique

### Backend
- ASP.NET Core 8 Web API
- **Données statiques JSON** — plus de MongoDB (migration terminée)
  - `PokéDesc.API/Data/all_pokemon.json` — tous les Pokémon
  - `PokéDesc.API/Data/all_types.json` — tous les types
  - Chargés en mémoire au démarrage via `PokemonRepository` (Singleton)
- Architecture N-Tiers : Domain → Data → Business → API
- **Pas de JWT, pas d'authentification** (supprimé intentionnellement)
- **Pas de comptes utilisateurs** (décision de conception)
- **Parties en mémoire** (`_fakeGameStore` dans `PartieService`) — pas de persistance

### Frontend (en cours de construction)
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui (composants Radix déjà installés)
- Zustand (state management global) — **installé** (`zustand` v5)
- axios — **installé** (`axios` v1)
- react-router v7 (déjà branché)
- `@microsoft/signalr` (pour les parties en temps réel — à implémenter)
- Gestionnaire de paquets : **pnpm**

---

## Données JSON statiques

Les données Pokémon sont lues depuis deux fichiers JSON placés dans `PokéDesc.API/Data/` :
- `all_pokemon.json` — tableau de Pokémon avec clés snake_case
- `all_types.json` — tableau de types Pokémon

Ces fichiers sont copiés dans le répertoire de sortie à la compilation (`CopyToOutputDirectory = PreserveNewest`).

**Aucune connection string n'est nécessaire** pour lancer le backend.

### ID des Pokémon
L'ID d'un Pokémon est son **numéro de Pokédex** (int), converti en string : `"1"`, `"2"`, etc.
Les endpoints `GET /api/pokemon/{id}` et `GET /api/pokemon/pokedex/{number}` font la même chose.

### Modèle Pokemon (champs clés)
```
Id (string = PokedexNumber.ToString()), NumericId, NameFr, NameEn, Category, PokedexNumber
Generation, Region, Status, Breeding, Physical
Types (List<PokemonType>), Abilities (List<Ability>)
Stats, Sprites, Cries, Moves, Description, EvolutionChain
```

Les modèles Domain utilisent `[JsonPropertyName]` (System.Text.Json) pour mapper les clés snake_case du JSON vers les propriétés PascalCase C#.

---

## CORS

Le backend autorise les origines depuis `appsettings.json` :
```json
"AllowedOrigins": ["http://localhost:5173"]
```
En production, surcharger via variable d'environnement `AllowedOrigins__0=https://mon-domaine.com`.

---

## Lancer le projet en local

### Backend
```bash
cd "PokéDesc.API"
dotnet run
# API disponible sur https://localhost:5122
# Swagger : https://localhost:5122/swagger
# Aucune variable d'environnement requise — données lues depuis Data/
```

### Frontend
```bash
cd FrontEnd
pnpm install
pnpm dev
# Disponible sur http://localhost:5173
```

---

## État de la migration

### Pages migrées ✅
| Page Blazor | Page React | Route |
|---|---|---|
| `Home.razor` | `src/app/pages/HomePage.tsx` | `/` et `/home` |
| `Partie.razor` | `src/app/pages/PartiePage.tsx` | `/partie` |
| `Guess.razor` | `src/app/pages/PokeDescPage.tsx` | `/pokedesc/:partieId` |
| — | `src/app/pages/ResultatsPage.tsx` | `/resultats/:partieId` ✅ |

### Pages abandonnées (décision définitive)
| Page Blazor | Raison |
|---|---|
| `Pokedex.razor` | ❌ Abandonné — pas de comptes utilisateurs, hors scope |
| `PokemonDetails.razor` | ❌ Abandonné — découle du Pokédex, hors scope |
| `Amis.razor` | ❌ Abandonné — nécessite des comptes utilisateurs |
| `CarteDresseur.razor` | ❌ Abandonné — nécessite des comptes utilisateurs |

### Pages / stubs restants (non prioritaires)
| Page | Route | Notes |
|---|---|---|
| Stubs divers | `/mini-jeux`, `/objets`, `/parametres`, `/succes` | Pages vides, ne pas toucher pour l'instant |

### Mini-jeux à créer (en attente)
| Jeu | Route | Statut |
|---|---|---|
| PokéDesc (deviner par description) | `/pokedesc/:partieId` | ✅ Migré |
| Typuzzle | `/types` | ⏸ En attente — ne pas toucher pour l'instant |
| Dézoom | `/dezoom` | ⏸ En attente — ne pas toucher pour l'instant |

---

## API Backend — Endpoints disponibles

### Pokemon — `GET /api/pokemon`
| Endpoint | Description |
|---|---|
| `GET /api/pokemon` | Tous les Pokémon (ou paginé avec `?page=1&pageSize=20`) |
| `GET /api/pokemon/{id}` | Par numéro de Pokédex (string ou int) |
| `GET /api/pokemon/pokedex/{number}` | Par numéro Pokédex (int) |
| `GET /api/pokemon/type/{typeName}` | Par type |
| `GET /api/pokemon/generation/{name}` | Par génération |
| `GET /api/pokemon/legendary` | Légendaires |
| `GET /api/pokemon/mythical` | Mythiques |
| `GET /api/pokemon/base-evolution` | Premiers de leur chaîne |
| `GET /api/pokemon/{id}/censored-description` | Description censurée (nom masqué) |
| `GET /api/pokemon/{id}/hints` | Indices du Pokémon |
| `GET /api/pokemon/{id}/name-fr` | Nom français |

### Partie — `POST/GET /api/partie`
| Endpoint | Body | Description |
|---|---|---|
| `POST /api/partie/create` | `{ dresseurId }` | Crée une partie |
| `POST /api/partie/join` | `{ codeSession, dresseurId }` | Rejoindre une partie |
| `GET /api/partie/{partieId}` | — | État de la partie |
| `POST /api/partie/{partieId}/start` | `{ mode, isSolo }` | Démarrer |
| `POST /api/partie/{partieId}/guess` | `{ dresseurId, pokemonName }` | Soumettre une réponse |
| `POST /api/partie/{partieId}/hint` | `{ dresseurId, hintType }` | Utiliser un indice |
| `GET /api/partie/{partieId}/timer/{dresseurId}` | — | Temps restant |
| `POST /api/partie/{partieId}/timer/reset` | `{ dresseurId }` | Reset timer |

### `dresseurId` — convention actuelle
Il n'y a plus de comptes utilisateurs. Le `dresseurId` est un **UUID généré côté frontend**
au premier chargement, persisté dans `localStorage` via Zustand (`sessionStore`).

---

## Structure du frontend React

```
FrontEnd/src/
├── app/
│   ├── App.tsx                  ← Layout principal (Sidebar + TopBar + Routes)
│   ├── pages/
│   │   ├── HomePage.tsx         ← Page d'accueil avec les 3 GameCards
│   │   ├── PartiePage.tsx       ← Lobby (pseudo → créer/rejoindre → waiting room)
│   │   ├── PokeDescPage.tsx     ← Jeu PokéDesc (description, hints, timer, modals)
│   │   └── ResultatsPage.tsx    ← Stub fin de partie
│   ├── components/
│   │   ├── GameCard.tsx         ← Carte cliquable vers un jeu (prop `to`)
│   │   ├── Sidebar.tsx          ← Navigation latérale
│   │   ├── TopBar.tsx           ← Barre du haut
│   │   ├── Pokeball.tsx         ← Composant décoratif / hamburger mobile
│   │   └── ui/                  ← Composants shadcn/ui (ne pas modifier)
│   ├── services/
│   │   ├── api.ts               ← Instance axios → VITE_API_URL
│   │   ├── pokemonService.ts    ← getAllPokemons, getCensoredDescription, getHints
│   │   └── partieService.ts     ← createPartie, joinPartie, startPartie, submitGuess, useHint, getTimer, resetTimer
│   ├── store/
│   │   └── sessionStore.ts      ← sessionId (UUID persisté), playerName, setPlayerName
│   └── types/
│       ├── pokemon.ts           ← PokemonDto, PokemonHintsDto, etc.
│       └── partie.ts            ← PartieDto, GuessResultDto, TimerResponse
├── styles/
│   ├── globals.css
│   ├── tailwind.css
│   └── theme.css
└── main.tsx                     ← Point d'entrée, BrowserRouter branché
```

### Conventions React à respecter
- Les pages vont dans `src/app/pages/`
- Les composants partagés vont dans `src/app/components/`
- Les appels API vont dans `src/app/services/`
- Le state global va dans `src/app/store/` (Zustand)
- Les types TypeScript vont dans `src/app/types/`

---

## State global (Zustand)

### `sessionStore.ts` ✅ créé
Stocke un UUID auto-généré (`crypto.randomUUID()`) persisté dans `localStorage`.
```ts
interface SessionStore {
  sessionId: string      // UUID généré une fois, persisté localStorage
  playerName: string     // Pseudo saisi par le joueur avant d'entrer dans le lobby
  setPlayerName: (name: string) => void
}
```
Clé localStorage : `pokegames-session`

---

## Flux de jeu PokéDesc

1. `HomePage` → bouton "C'est parti !" → `/partie`
2. `PartiePage` → saisir pseudo (si absent) → créer ou rejoindre une partie
3. Lobby : auto-refresh toutes les 2s → attend `Statut === "EnCours"`
4. Redirection auto vers `/pokedesc/:partieId`
5. `PokeDescPage` → jeu (description, indices, timer, deviner)
6. Fin de partie → `/resultats/:partieId` (stub)

---

## Variables d'environnement

### Frontend (Vite)
Créer `FrontEnd/.env.local` (jamais commité) :
```
VITE_API_URL=http://localhost:5122
```

### Backend
Aucune variable requise. Les données JSON sont embarquées dans le projet.

---

## Docker (mis en pause)

Les fichiers sont créés mais le déploiement Docker est reporté après la migration :
- `Dockerfile.backend` — build multi-stage .NET 8
- `FrontEnd/Dockerfile` — build Vite → nginx
- `docker-compose.yml` — orchestration locale
- `.env.example` — template des variables

Cible de déploiement : **Render ou Railway**, deux services séparés (back + front).

---

## Fichiers Blazor à consulter (référence)

Ces fichiers ne sont **pas** à modifier mais servent de référence pour la migration :
- `Projet_FullStack_FrontEnd/Components/Pages/Resultats.razor` — écran de fin (à migrer)
- `Projet_FullStack_FrontEnd/Components/Pages/Pokedex.razor` — liste Pokédex (à migrer)
- `Projet_FullStack_FrontEnd/Hubs/ChatHub.cs` — SignalR à recréer côté React
