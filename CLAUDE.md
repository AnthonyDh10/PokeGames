# CLAUDE.md — Refonte multijoueur : lobby 8 joueurs avec rôles Hôte/Invités

> Document de référence pour la migration du multijoueur de **2 joueurs hardcodés**
> vers un **lobby dynamique jusqu'à 8 joueurs** avec rôles asymétriques (Hôte / Invité)
> et communication temps réel. À lire avant toute intervention sur le lobby ou le gameplay.

---

## 1. Contexte projet

**Jeu Pokémon en temps réel.** Plusieurs mini-jeux (PokéDesc, Dex-Zoom, Typuzzle) où les
joueurs devinent des Pokémon. Le multijoueur actuel est limité à 2 joueurs.

### Stack
- **Front-end** : React 18 + TypeScript, Vite, Zustand (state), Tailwind, Radix UI, `@microsoft/signalr`. Gestionnaire de paquets : **pnpm**. Tests : Vitest. Dossier : `FrontEnd/`.
- **Back-end** : .NET 8, architecture N-tiers, SignalR. Stockage des parties **in-memory** (singletons), pas de base de données pour les parties.

### Structure des projets .NET
| Projet | Rôle |
|---|---|
| `PokéDesc.API` | Controllers REST, Hubs SignalR, DTOs, Program.cs (DI + pipeline) |
| `PokéDesc.Business` | Services, Interfaces, Stratégies de mode de jeu, Helpers |
| `PokéDesc.Domain` | Entités domaine (`Partie`, `Dresseur`, `PlayerGameState`…), invariants |
| `PokéDesc.Data` | Repositories (lecture JSON Pokémon/types, read-only) |
| `PokéDesc.Tests` | Tests unitaires back-end |

### Commandes utiles
```bash
# Back-end
dotnet build PokéDesc.sln
dotnet test
dotnet run --project PokéDesc.API      # API + hubs sur http://localhost:5122

# Front-end (depuis FrontEnd/)
pnpm install
pnpm dev                                # Vite sur http://localhost:5173
pnpm test:run                           # Vitest
```

### Conventions
- Code et commentaires en **français** (respecter l'existant).
- JSON API en **camelCase** (configuré dans `Program.cs`).
- Identité joueur = `sessionId` (UUID `crypto.randomUUID()` persisté en localStorage,
  `FrontEnd/src/app/store/sessionStore.ts`), transmis comme `dresseurId` dans les requêtes.
  Pas d'authentification.
- Services back-end enregistrés en **Singleton** (état serveur in-memory).

---

## 2. Décisions verrouillées

Ces choix ont été validés et cadrent toute l'implémentation :

| Décision | Choix retenu |
|---|---|
| **Transport temps réel** | **Hybride** : commandes en REST (conservées, déjà testées) + état poussé via SignalR. On supprime le polling HTTP. |
| **Périmètre initial** | **PokéDesc + lobby d'abord**. DeZoom / Typuzzle migrés ensuite (Phase 6). |
| **Modèle de jeu à N** | **Course parallèle** : chaque joueur progresse indépendamment sur la même liste de Pokémon, classement par score. (Généralise le modèle actuel.) |
| **Capacité** | 8 joueurs max par lobby (`MaxPlayers = 8`). |
| **Rôles** | `Host` (créateur) / `Guest`. Autorisation **côté serveur** sur start / settings / kick. |
| **Hôte qui quitte** | Promotion automatique du joueur suivant en Hôte. |
| **Contrat DTO** | Clean cut : on remplace `*J1/*J2` par `Players[]`, sans rétro-compat. Front + back migrent en lockstep. |

---

## 3. Audit de l'existant

### 3.1 Techno temps réel : SignalR, mais confiné au chat
SignalR est présent (`AddSignalR()`, `MapHub<ChatHub>("/chatHub")`) **mais ne sert qu'au chat**.

| Domaine | Transport réel aujourd'hui |
|---|---|
| Chat | ✅ SignalR — `PokéDesc.API/Hubs/ChatHub.cs`, `FrontEnd/src/app/services/chatService.ts` |
| Lobby (attente, démarrage) | ❌ **HTTP polling 2 s** — `setInterval(refreshPartie, 2000)` dans `LobbyPage.tsx` |
| Gameplay (guess, hint, timer) | ❌ REST pur — `PartieController.cs` |

➡️ Le « temps réel » du lobby est en réalité un `GET /api/partie/{id}` toutes les 2 s.
L'infra SignalR à généraliser **existe déjà** (pattern `Groups` par `partieId` éprouvé dans `ChatHub`).

### 3.2 Couplage « 2 joueurs » (structurel, traverse les 5 couches)

**Back-end**
- `PokéDesc.Domain/Partie.cs` : `Dresseur1Id`, `Dresseur2Id?`, `StateJ1`, `StateJ2`, `GetState(bool isJ1)`, `Join()` qui **throw si un 2ᵉ joueur existe**.
- `PokéDesc.Business/Services/PartieService.cs` : partout `bool isJ1 = dresseurId == partie.Dresseur1Id`. `MarkRematchReadyAsync` raisonne en `StateJ1.RematchReady && StateJ2.RematchReady`.
- `PokéDesc.Business/Services/TimerService.cs` : même `GetState(dresseurId == Dresseur1Id)`.
- `PokéDesc.API/DTOs/GameRequests.cs` → `PartieResponseDto` : contrat **aplati** (`ScoreJ1/J2`, `CurrentIndexJ1/J2`…).
- **Aucun rôle formalisé** : « Dresseur1 = créateur » fait office d'hôte mais n'est jamais autorisé côté serveur (un invité peut appeler `/start` directement).

**Front-end**
- `FrontEnd/src/app/types/partie.ts` → `PartieDto` miroir aplati J1/J2.
- `FrontEnd/src/app/components/game/LobbyPage.tsx` : booléen `isPlayer1`, UI **2 slots fixes** (Joueur 1 / VS / Joueur 2), polling 2 s.
- Pages résultats + `useGameState` raisonnent en J1-vs-J2.

### 3.3 Point d'appui déterminant
`PokéDesc.Domain/Models/PlayerGameState.cs` est **déjà** une structure propre par-joueur
(score, index, attemptsUsed, usedHints, timer, completedPokemons, rematchReady).
Le problème n'est pas l'état d'un joueur — c'est que `Partie` en contient **exactement deux, nommés**.
La refonte = passer de `StateJ1 + StateJ2` à **une collection de joueurs**. `PlayerGameState` est **réutilisé tel quel**.

---

## 4. Architecture cible

### 4.1 Modèle de données — Back-end

```csharp
public enum PlayerRole { Host, Guest }

public class Player                              // ex-"slot" J1/J2, désormais dynamique
{
    public string DresseurId { get; set; } = ""; // = sessionId (identité)
    public string Name { get; set; } = "";
    public PlayerRole Role { get; set; }
    public bool IsConnected { get; set; } = true; // piloté par SignalR (Phase 5)
    public PlayerGameState State { get; set; } = new();  // ← INCHANGÉ, réutilisé
}

public class Partie
{
    public string Id { get; set; } = "";
    public string CodeSession { get; set; } = "";
    public PartieStatut Statut { get; set; } = PartieStatut.EnAttente;

    public string HostId { get; set; } = "";           // remplace "Dresseur1 = hôte"
    public int MaxPlayers { get; set; } = 8;
    public List<Player> Players { get; set; } = new();  // remplace Dresseur1/2Id + StateJ1/J2

    // Paramètres + Pokémon : inchangés
    public int NbPokemons { get; set; } = 3;
    public List<int> SelectedGenerations { get; set; } = new();
    public int TimerDurationSeconds { get; set; } = 60;
    public List<Pokemon> PokemonsToGuess { get; set; } = new();
    public string? RematchPartieId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Helpers domaine (invariants centralisés)
    public Player? GetPlayer(string dresseurId) => Players.FirstOrDefault(p => p.DresseurId == dresseurId);
    public bool IsHost(string dresseurId) => dresseurId == HostId;
    public bool CanJoin() => Statut == PartieStatut.EnAttente && Players.Count < MaxPlayers;
    public void Join(string dresseurId, string name);    // vérifie CanJoin, ajoute un Guest
    public void Remove(string dresseurId);               // retire un joueur
    public void PromoteNewHost();                        // si l'hôte part : 1er restant → Host
}
```

Conséquences mécaniques :
- `partie.GetState(isJ1)` → `partie.GetPlayer(dresseurId).State` partout.
- `MarkRematchReady` : `Players.All(p => p.State.RematchReady)`.
- `Statut` se simplifie : `EnAttente` (lobby ouvert) → `EnCours` → `Termine`. L'ancien `Pret` (« 2ᵉ a rejoint ») disparaît : c'est l'hôte qui décide de lancer.

### 4.2 Contrat DTO (cassant, assumé)

```csharp
public class PartieResponseDto {
    string Id; string CodeSession; string Statut;
    string HostId; int MaxPlayers;
    GameSettingsDto Settings;                 // nbPokemons, generations, timerDuration
    List<PlayerDto> Players;                  // ← remplace tous les *J1/*J2
}
public class PlayerDto {
    string DresseurId; string Name; string Role; bool IsConnected;
    int CurrentIndex; int Score; int AttemptsUsed; List<string> UsedHints;
    string? CurrentPokemonId; double TimeRemaining; bool RematchReady;
    List<CompletedPokemonDto> CompletedPokemons;
}
```

### 4.3 Transport temps réel (hybride)
Commandes en **REST** (create/join/start/guess/hint), état **poussé via SignalR** au groupe `partieId`.
Pour respecter la séparation N-tiers (Business ne doit pas référencer ASP.NET SignalR) :

```
Business définit :  interface ILobbyNotifier { Task NotifyLobbyUpdated(string partieId); Task NotifyGameStarted(string partieId); }
API implémente :    LobbyNotifier(IHubContext<GameHub>) → Clients.Group(partieId).SendAsync("LobbyUpdated", dto)
```

`GameHub` reprend le pattern `Groups.AddToGroupAsync(ConnectionId, partieId)` de `ChatHub`.
Events serveur → client : `LobbyUpdated`, `GameStarted`, `PlayerKicked`.

### 4.4 State management — Front-end
- **`lobbyStore`** (Zustand) : `{ partie, players, myId, me, isHost, hostId }`, hydraté par les events SignalR.
- **`lobbyService`** (calqué sur `chatService.ts`) : connexion `GameHub`, écoute des events, expose les actions.
- `LobbyPage` : `players.map(...)` au lieu des 2 slots, badge Hôte, bouton Kick (hôte only), Start gaté par `isHost`. **Suppression du `setInterval`**.
- `isPlayer1` → `isHost` + `me = players.find(p => p.dresseurId === sessionId)`.
- Pages résultats : scoreboard trié à N joueurs au lieu du face-à-face.

---

## 5. Plan de migration (phases livrables)

> Règle : chaque phase doit laisser le projet **compilable, testé et jouable**.
> Cocher les critères d'acceptation avant de passer à la suivante.

### Phase 1 — Transport temps réel (toujours 2 joueurs)
**Objectif :** remplacer le polling 2 s par du push SignalR, **sans toucher au modèle de données**, pour isoler le risque et prouver le pattern.

**Back-end**
- [ ] `PokéDesc.API/Hubs/GameHub.cs` *(nouveau)* — `JoinRoom`/`LeaveRoom` par `partieId`, calqué sur `ChatHub`.
- [ ] `PokéDesc.Business/Interfaces/ILobbyNotifier.cs` *(nouveau)* — abstraction (Business ne référence pas SignalR).
- [ ] `PokéDesc.API/Services/LobbyNotifier.cs` *(nouveau)* — implémente `ILobbyNotifier` via `IHubContext<GameHub>`.
- [ ] `PartieService.cs` — injecter `ILobbyNotifier` ; appeler `NotifyLobbyUpdated` après join/start/settings/guess/hint/timeout/rematch.
- [ ] `Program.cs` — `MapHub<GameHub>("/gameHub")` + DI de `ILobbyNotifier`.

**Front-end**
- [ ] `FrontEnd/src/app/services/lobbyService.ts` *(nouveau)* — connexion `GameHub`, écoute `LobbyUpdated` / `GameStarted`.
- [ ] `LobbyPage.tsx` — retirer `startAutoRefresh` / `setInterval`, s'abonner au push. UI 2 slots **inchangée**.

**Critères d'acceptation**
- Un 2ᵉ joueur qui rejoint apparaît chez l'hôte **sans délai de polling**.
- Le démarrage de la partie redirige les deux joueurs via l'event `GameStarted`.
- Aucun changement de contrat DTO ⇒ tests back + `partieService.test.ts` **restent verts**.

**Risque :** faible. **Pré-requis :** aucun.

---

### Phase 2 — Joueurs dynamiques + rôles (back-end)
**Objectif :** casser le modèle binaire `Dresseur1/2` + `StateJ1/J2`.

- [ ] `PokéDesc.Domain` : ajouter `Player`, `PlayerRole` ; refondre `Partie` (`List<Player>`, `HostId`, `MaxPlayers`, helpers `GetPlayer`/`IsHost`/`CanJoin`/`Join`/`Remove`/`PromoteNewHost`).
- [ ] `PokéDesc.Domain/Models/PartieStatut.cs` : simplifier (`EnAttente` → `EnCours` → `Termine`), retirer `Pret`.
- [ ] `PartieService.cs` : remplacer tous les `GetState(isJ1)` par `GetPlayer(dresseurId).State` ; `JoinGameAsync` avec contrôle de capacité ; `MarkRematchReadyAsync` → `Players.All(...)`.
- [ ] `TimerService.cs` : idem `GetPlayer(dresseurId)`.
- [ ] **Autorisation hôte côté serveur** : `StartGame`, `UpdateGameSettings`, et nouveau `KickPlayer` rejettent si `!partie.IsHost(dresseurId)`.
- [ ] Nouvelles commandes : `KickPlayerAsync(partieId, hostId, targetId)`, `LeaveGameAsync(partieId, dresseurId)` (+ promotion d'hôte).
- [ ] `GameRequests.cs` : `PartieResponseDto` → `Players[]` + `HostId` + `MaxPlayers` ; nouvelles requêtes (`JoinGameRequest` ajoute `Name`, `KickPlayerRequest`…).
- [ ] `PartieController.cs` : endpoints `kick`, `leave` ; passage des requêtes.
- [ ] `PokéDesc.Tests` : mettre à jour la suite pour le modèle `Players[]`.

**Critères d'acceptation**
- Création → 1 `Player` Host. Join → ajout d'un `Guest` jusqu'à 8, refus au-delà.
- Un invité ne peut pas démarrer / modifier les settings / kick (403/erreur).
- Hôte qui quitte → promotion auto du joueur suivant.
- Tests back **verts** (adaptés).

**Risque :** moyen. **Pré-requis :** Phase 1.

---

### Phase 3 — Joueurs dynamiques + rôles (front-end)
**Objectif :** UI lobby dynamique pilotée par la liste de joueurs.

- [ ] `FrontEnd/src/app/types/partie.ts` : `PartieDto` → `players: PlayerDto[]`, `hostId`, `maxPlayers`.
- [ ] `FrontEnd/src/app/store/lobbyStore.ts` *(nouveau)* — `{ partie, players, myId, me, isHost, hostId }`.
- [ ] `partieService.ts` : adapter create/join (envoi du `name`), ajouter `kick`/`leave`.
- [ ] `LobbyPage.tsx` : rendu `players.map(...)`, badge Hôte, bouton Kick (hôte only), Start gaté `isHost`, slot « En attente » jusqu'à 8. Remplacer `isPlayer1` par `isHost` + lookup `me`.

**Critères d'acceptation**
- Liste des joueurs en temps réel (jusqu'à 8), arrivées/départs/kick visibles immédiatement.
- Seul l'hôte voit Start + Kick ; un invité voit « en attente de l'hôte ».

**Risque :** moyen. **Pré-requis :** Phases 1–2.

---

### Phase 4 — Jeu & résultats à N joueurs (PokéDesc)
**Objectif :** généraliser le gameplay et les résultats au-delà de 2.

- [ ] Pages de jeu / `useGameState.ts` : lire `me` dans `players[]` (plus de J1/J2).
- [ ] Pages résultats (`ResultatsPage.tsx`, `useResultats.ts`) : **scoreboard trié** à N joueurs, calcul du gagnant sur l'ensemble.
- [ ] Rematch à N : tous prêts → relance ; conserver la composition du lobby.

**Critères d'acceptation**
- Partie jouable à 3–8 joueurs en course parallèle, classement final correct.
- Rematch fonctionnel avec ≥ 3 joueurs.

**Risque :** moyen. **Pré-requis :** Phases 1–3.

---

### Phase 5 — Robustesse / production-ready
- [ ] `GameHub.OnDisconnectedAsync` → marque `IsConnected = false` + broadcast.
- [ ] Reconnexion (`withAutomaticReconnect` déjà actif côté client) + resync de l'état.
- [ ] Hôte qui se déconnecte en cours de partie → promotion.
- [ ] TTL / cleanup des lobbies inactifs (s'inspirer du `CleanupExpiredRooms` de `ChatHub`).
- [ ] Cas limites : lobby plein, joueur déjà présent, partie déjà démarrée, kick de soi-même.

**Critères d'acceptation**
- Un joueur qui ferme l'onglet apparaît « déconnecté » puis est nettoyé.
- Aucune partie fantôme ne s'accumule en mémoire.

**Risque :** moyen. **Pré-requis :** Phases 1–4.

---

### Phase 6 — Réplication DeZoom / Typuzzle *(hors chemin critique)*
Les mini-jeux DeZoom et Typuzzle ont leur propre état (`MiniGameStore<>`, `MiniGamePlayerState`,
`MiniGameServiceBase`). Appliquer le même schéma (liste de joueurs + rôles + push SignalR)
une fois PokéDesc validé de bout en bout.

---

## 6. Points de vigilance
- **Ne pas mélanger les phases** : Phase 1 ne change PAS le DTO ; le clean cut J1/J2 → `Players[]` n'arrive qu'en Phase 2 (front + back en lockstep).
- **Séparation N-tiers** : la couche Business passe par `ILobbyNotifier`, jamais par `IHubContext` directement.
- **Autorisation** : tout contrôle de rôle (start/settings/kick) doit être **revérifié côté serveur**, pas seulement masqué en UI.
- **Concurrence** : conserver les locks par partie (`GetOrCreateLock`) sur toute mutation de la liste de joueurs.
- **Identité** : `sessionId` reste la clé ; le `Name` est cosmétique et peut entrer en collision (ne pas l'utiliser comme identifiant).

---

## 7. Statut d'avancement
- [ ] Phase 1 — Transport temps réel
- [ ] Phase 2 — Joueurs dynamiques + rôles (back)
- [ ] Phase 3 — Joueurs dynamiques + rôles (front)
- [ ] Phase 4 — Jeu & résultats à N (PokéDesc)
- [ ] Phase 5 — Robustesse
- [ ] Phase 6 — DeZoom / Typuzzle

_Mettre à jour cette section au fil de l'implémentation._
