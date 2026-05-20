# Tests — PokéGames

## Lancer les tests

### Backend (xUnit)
```bash
cd "PokéDesc.Tests"
dotnet test
```
Ou depuis la racine :
```bash
dotnet test PokéDesc.Tests
```
> Premier lancement ~100s (chauffe JIT). Les suivants ~30s. C'est normal sur Windows.

### Frontend (Vitest)
```bash
cd FrontEnd
pnpm test:run        # une seule passe, affiche les résultats
pnpm test            # mode watch (relance à chaque sauvegarde)
pnpm test:coverage   # génère un rapport de couverture dans coverage/
```

---

## Résumé des tests

| | Fichiers | Tests | Résultat |
|---|---|---|---|
| **Backend** | 6 | **91** | ✅ tous passent |
| **Frontend** | 8 | **59** | ✅ tous passent |
| **Total** | 14 | **150** | ✅ |

---

## Backend — PokéDesc.Tests (xUnit + Moq)

### Architecture du projet de tests
```
PokéDesc.Tests/
├── GlobalUsings.cs             ← global using Xunit; + namespaces communs
├── TestData/
│   └── all_pokemon.json        ← 4 Pokémon minimaux (Bulbizarre, Salamèche, Mewtwo, Mew)
├── Helpers/
│   └── TestDataFactory.cs      ← Constructeurs de données de test réutilisables
├── Services/
│   ├── PokemonServiceTests.cs  ← 20 tests
│   └── PartieServiceTests.cs   ← 20 tests
└── Controllers/
    ├── PokemonControllerTests.cs      ← 12 tests
    ├── PartieControllerTests.cs       ← 15 tests
    ├── TypesGameControllerTests.cs    ←  7 tests
    └── DeZoomControllerTests.cs       ←  8 tests (17 au total avec PartieController)
```

### Stratégie
- **Services** : `PokemonRepository` est une classe concrète avec méthodes non-virtuelles → impossible à Mocker. On utilise le vrai repository pointant sur `TestData/all_pokemon.json` (4 Pokémon).
- **Partie** : `PartieService` utilise un dictionnaire statique `ConcurrentDictionary`. Chaque test crée sa propre partie avec un `Guid.NewGuid()` pour éviter les collisions.
- **Controllers** : Mocking de toutes les interfaces `IXxxService` avec Moq.

### Ce qui est testé

#### `PokemonServiceTests.cs` (20 tests)
| Test | Vérifie |
|---|---|
| GetAllPokemonsAsync | Retourne tous les Pokémon du JSON |
| GetPokemonByIdAsync (string valide) | Retourne le bon Pokémon |
| GetPokemonByIdAsync (numéro en string) | Accepte `"1"` comme id |
| GetPokemonByIdAsync (inconnu) | Lance `KeyNotFoundException` |
| GetPokemonByPokedexNumberAsync | Retourne par numéro Pokédex |
| GetLegendaryPokemonsAsync | Filtre `is_legendary = true` |
| GetMythicalPokemonsAsync | Filtre `is_mythical = true` |
| GetLegendaryOrMythicalPokemonsAsync | Union des deux |
| GetPokemonsByTypeAsync | Filtre par type (insensible à la casse) |
| GetPokemonsByGenerationAsync | Filtre par génération |
| GetCensoredDescriptionAsync | Masque le nom dans la description |
| GetPokemonHintsAsync | Retourne les types, génération, stats, etc. |
| GetPokemonNameFrAsync | Retourne le nom français |
| GetPokemonByNameAsync | Recherche insensible à la casse |
| GetPokemonsPaginatedAsync | Pagination (page 1, taille 2) |

#### `PartieServiceTests.cs` (20 tests)
| Test | Vérifie |
|---|---|
| CreateGameAsync | Crée une partie en statut `EnAttente`, génère un code session |
| CreateGameAsync IDs uniques | Deux créations → deux IDs différents |
| GetGameAsync (valide) | Retourne la partie |
| GetGameAsync (inconnu) | Retourne `null` |
| JoinGameAsync (valide) | Statut passe à `Prêt`, ajoute dresseur2 |
| JoinGameAsync (mauvais code) | Lance `InvalidOperationException` |
| JoinGameAsync (partie pleine) | Lance `InvalidOperationException` |
| JoinGameAsync (code insensible casse) | `abc123` = `ABC123` |
| StartGameAsync Standard | Statut `EnCours`, `PokemonsToGuess` non vide |
| StartGameAsync mode inconnu | Lance `ArgumentException` |
| UseHintAsync (valide) | Ajoute l'indice dans `UsedHintsJ1` |
| UseHintAsync (indice inconnu) | Lance `ArgumentException` |
| UseHintAsync (doublon) | Lance `InvalidOperationException` |
| SubmitGuessAsync (correct) | `isCorrect=true`, points attribués, tour terminé |
| SubmitGuessAsync (faux) | `isCorrect=false` |
| SubmitGuessAsync (3 mauvaises) | Tour terminé malgré erreur |
| ResetTimer | Remet le timer à la durée initiale |
| UpdateGameSettingsAsync | Met à jour les paramètres de la partie |

#### `PokemonControllerTests.cs` (12 tests)
| Test | Vérifie |
|---|---|
| GetAll sans pagination | 200 + liste complète |
| GetAll avec pagination | Passe les bons paramètres au service |
| GetAll exception | Retourne 500 |
| GetByType | 200 + liste filtrée |
| GetLegendary / GetMythical / GetLegendaryOrMythical | 200 + résultats corrects |
| GetCensoredDescription (valide) | 200 |
| GetCensoredDescription (inconnu) | 404 |
| GetHints (valide / inconnu) | 200 / 404 |
| GetBaseEvolution | 200 |

#### `PartieControllerTests.cs` (15 tests)
| Test | Vérifie |
|---|---|
| CreateGame | 200 + PartieDto |
| JoinGame (valide / invalide) | 200 / 400 |
| GetGame (valide / inconnu) | 200 / 404 |
| SubmitGuess (valide / partie inconnue) | 200 / 404 |
| UseHint (valide / hint inconnu / partie inconnue) | 200 / 400 / 404 |
| StartGame (valide / mode inconnu) | 200 / 400 |
| GetRemainingTime (valide / exception) | 200 / 500 |
| ResetTimer | 204 |
| MarkRematchReady (valide / dresseurId vide) | 200 / 400 |

#### `TypesGameControllerTests.cs` (7 tests)
| Test | Vérifie |
|---|---|
| GetAllTypes | 200 + liste des types |
| GetGame avec dresseurId | 200 |
| GetGame sans dresseurId | 400 |
| GetResults | 200 |
| MarkRematchReady avec / sans dresseurId | 200 / 400 |
| SubmitGuess | 200 |

#### `DeZoomControllerTests.cs` (8 tests)
| Test | Vérifie |
|---|---|
| GetGame avec dresseurId | 200 |
| GetGame sans dresseurId | 400 |
| GetGame partie introuvable | 200 (gracieux) |
| GetResults | 200 |
| SubmitGuess | 200 + résultat |
| SkipPokemon avec / sans dresseurId | 200 / 400 |
| MarkRematchReady avec / sans dresseurId | 200 / 400 |

---

## Frontend — Vitest + React Testing Library

### Architecture des tests
```
FrontEnd/src/__tests__/
├── utils/
│   └── pokedescLogic.test.ts   ← 20 tests
├── stores/
│   ├── sessionStore.test.ts    ←  4 tests
│   └── chatStore.test.ts       ←  8 tests
├── services/
│   ├── partieService.test.ts   ←  7 tests
│   ├── pokemonService.test.ts  ←  3 tests
│   └── typesGameService.test.ts←  5 tests
└── hooks/
    ├── useTimer.test.ts        ←  6 tests
    └── useGameState.test.ts    ←  6 tests
```

### Stratégie
- **Utils** : tests purs (pas de mocks), entrées/sorties directes.
- **Stores Zustand** : reset du store dans `beforeEach`, tests d'isolation.
- **Services API** : `vi.mock('../../app/services/api')` — mock d'axios, vérifie les URLs et payloads appelés.
- **Hooks** : `renderHook` de RTL, `vi.useFakeTimers()` pour `useTimer`, `vi.mock` des services.

### Ce qui est testé

#### `pokedescLogic.test.ts` (20 tests)
| Fonction | Tests |
|---|---|
| `generationToNumber` | `generation-i`→1, `generation-ix`→9, inconnu→null, vide→null |
| `isHintLocked` | Déjà utilisé→false, timer infini→false, pénalité>temps→true, pénalité≤temps→false |
| `filterHintPokemons` | Aucun filtre, par génération, par Type 1, par Génération, "Pas de second type" |
| `filterSearchPokemons` | Recherche vide→[], correspondance nom, correspondance numéro Pokédex, aucune→[] |

#### `sessionStore.test.ts` (4 tests)
- `sessionId` est un UUID valide
- `setPlayerName` met à jour le nom
- `playerName` initial est vide
- Plusieurs appels à `setPlayerName` écrasent la valeur précédente

#### `chatStore.test.ts` (8 tests)
- État initial correct (`messages=[]`, `isOpen=false`)
- `setContext` met à jour partieId, sessionCode, isSolo
- `setContext` avec **nouveau** partieId efface les messages
- `setContext` avec **même** partieId conserve les messages
- `toggleOpen` inverse `isOpen`
- `addMessage` ajoute un message
- `clearMessages` vide la liste
- `addMessage` garde au maximum **100** messages (slice(-100))

#### `partieService.test.ts` (7 tests)
| Fonction | Vérifie |
|---|---|
| `createPartie` | POST `/api/partie/create` avec `{ dresseurId }` |
| `joinPartie` | POST `/api/partie/join` avec codeSession + dresseurId |
| `getPartie` | GET `/api/partie/:id` |
| `startPartie` (Standard) | POST avec `nbPokemons`, `generations`, `timerDuration` |
| `submitGuess` | POST `/api/partie/:id/guess` |
| `useHint` | POST `/api/partie/:id/hint` |
| `getTimer` | GET `/api/partie/:id/timer/:dresseurId` |

#### `pokemonService.test.ts` (3 tests)
| Fonction | Vérifie |
|---|---|
| `getAllPokemons` | GET `/api/pokemon` |
| `getCensoredDescription` | GET `/api/pokemon/:id/censored-description` |
| `getHints` | GET `/api/pokemon/:id/hints` |

#### `typesGameService.test.ts` (5 tests)
| Fonction | Vérifie |
|---|---|
| `getAllTypes` | GET `/api/types-game/types` |
| `getTypesGame` | GET `/api/types-game/:id?dresseurId=...` |
| `submitTypesGuess` | POST avec type1Id, type2Id, elapsedSeconds, attemptCount |
| `getTypesGameResults` | GET `/api/types-game/:id/results` |
| `markRematchReady` | POST `/api/types-game/:id/rematch-ready?dresseurId=...` |

#### `useTimer.test.ts` (6 tests)
- `timeRemaining` initialisé à 60
- `startTimer` appelle `getTimer` toutes les 100ms
- `stopTimer` arrête les appels
- `onTimeout` appelé quand `timeRemaining` passe à 0
- `onTimeout` **non** appelé si `timerDurationSeconds = -1` (timer infini)
- `timeRemaining` mis à jour avec la valeur serveur

#### `useGameState.test.ts` (6 tests)
- `isLoading = true` au montage
- `loadGameData` charge la partie et les descriptions
- `loadGameData` détecte correctement le joueur 1
- `loadGameData` définit score, tentatives et indices utilisés
- `loadGameData` gère une erreur réseau (`errorMessage` rempli)
- `processRevealedHints` mappe `Type1` → `revealedHints['Type 1']`

---

## Ce qui N'est PAS testé (hors scope)

| Élément | Raison |
|---|---|
| Pages React (`HomePage`, `PartiePage`, etc.) | Tests d'intégration/E2E — hors scope |
| `DeZoomGamePage`, `TypesGamePage` | Idem |
| SignalR / `ChatHub` | Nécessiterait un serveur WebSocket mock |
| `PokemonRepository` directement | Testé indirectement via `PokemonService` |
| `TypesGameService` / `DeZoomService` (Business) | Services complexes avec état local — hors scope initial |
| Couverture CSS / design system | Non pertinent pour les tests unitaires |
