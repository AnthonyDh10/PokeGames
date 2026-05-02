# Design System — PokéGames Hub

Référence de direction artistique à lire avant de créer ou modifier une page/composant.
Toute nouvelle UI doit respecter ce guide pour maintenir une cohérence visuelle.

> **Sources de vérité :**
> - Couleurs → `src/app/design/colors.ts`
> - Typographie → `src/app/design/typography.ts`
> - Variables CSS / classes Tailwind → `src/styles/theme.css`

---

## Palette de couleurs

### Règle fondamentale

Ne jamais écrire un code hexadécimal directement dans un composant.
Utiliser soit les **constantes TypeScript** (`colors.brand.red`), soit les **classes Tailwind** nommées (`bg-pokered`).

```ts
import { colors } from "../design/colors";

// ✅ Correct
style={{ backgroundColor: colors.brand.red }}
style={{ backgroundColor: colors.brand.redDark }}

// ❌ Interdit
style={{ backgroundColor: "#DC0A2D" }}
className="bg-[#DC0A2D]"
```

---

### Couleurs de marque (brand)

| Constante `colors.brand` | Valeur | Classe Tailwind | Usage |
|---|---|---|---|
| `red` | `#DC0A2D` | `bg-pokered-light` | Accents principaux, lobby PokéDesc (create) |
| `redDark` | `#B3000C` | `bg-pokered` | TopBar, bordure principale, lobby DeZoom (explication) |
| `redDeep` | `#8B0000` | `bg-pokered-dark` | Hover sidebar, lobby DeZoom (rejoindre) |
| `yellow` | `#FFCF1A` | `bg-pokeyellow` | Lobby Types (create), accents |
| `yellowWarm` | `#FFC800` | — | Lobby Types (explication, salle d'attente) |
| `yellowLight` | `#FFD52E` | — | Lobby Types (rejoindre) |
| `blue` | `#3B4CCA` | `bg-pokeblue` | Lobby PokéDesc (create), action principale |
| `blueDark` | `#2E3DA0` | — | Lobby PokéDesc (explication), fond stripe jeu |
| `blueLight` | `#5B69D2` | — | Lobby PokéDesc (rejoindre) |
| `pokeballRed` | `#FF0000` | — | Exclusivement le composant `<Pokeball />` |

> **Règle hover sidebar :** classes Tailwind uniquement (nécessaires pour l'état hover).
> Utiliser `bg-pokered hover:bg-pokered-dark`, pas de style inline.

---

### Couleurs d'interface (ui)

| Constante `colors.ui` | Valeur | Usage |
|---|---|---|
| `bgLeft` | `#FFFFFF` | Fond diagonal gauche — pages neutres (HomePage) |
| `bgStripe` | `#A6ACAF` | Bande diagonale — pages neutres |
| `bgRight` | `#BDC3C7` | Fond diagonal droit — pages neutres |
| `bgLeftGame` | `#FFFFFF` | Fond diagonal gauche — pages de jeu |
| `bgStripeGame` | `#2E3DA0` | Bande diagonale — pages de jeu (PokéDesc) |
| `bgRightGame` | `#3B4CCA` | Fond diagonal droit — pages de jeu (PokéDesc) |
| `textPrimary` | `#1A1A2E` | Texte principal sur fond clair |
| `textMuted` | `#4C4C57` | Texte secondaire / descriptif |
| `textOnColor` | `#FFFFFF` | Texte sur fond coloré foncé (rouge, bleu) |

### Fond diagonal par mini-jeu

Chaque lobby/jeu a sa propre couleur de fond. Toujours appeler `setBackground` dans un `useEffect` au montage de la page.

| Jeu | `colorStripe` | `colorRight` |
|---|---|---|
| PokéDesc | `colors.brand.blueDark` | `colors.brand.blue` |
| Quel est ce type ? | `colors.brand.yellowWarm` | `colors.brand.yellow` |
| DeZoom | `colors.brand.redDark` | `colors.brand.red` |

```ts
// Changer le fond diagonal d'une page
import { colors } from "../design/colors";
const { setBackground } = useBackgroundStore();

// Page neutre (accueil)
setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });

// Lobby PokéDesc
setBackground({ colorLeft: colors.ui.bgLeftGame, colorStripe: colors.brand.blueDark, colorRight: colors.brand.blue });

// Lobby Types
setBackground({ colorLeft: colors.ui.bgLeftGame, colorStripe: colors.brand.yellowWarm, colorRight: colors.brand.yellow });

// Lobby DeZoom
setBackground({ colorLeft: colors.ui.bgLeftGame, colorStripe: colors.brand.redDark, colorRight: colors.brand.red });
```

### Convention de couleurs par mini-jeu (lobby + jeu)

Chaque mini-jeu a une couleur principale. Appliquer cette couleur de façon cohérente sur le lobby et la page de jeu associés.

| Mini-jeu | Route lobby | Couleur principale | Variante foncée | Variante claire |
|---|---|---|---|---|
| PokéDesc | `/lobby-pokedesc` | `colors.brand.blue` | `colors.brand.blueDark` | `colors.brand.blueLight` |
| Quel est ce type ? | `/types` | `colors.brand.yellow` | `colors.brand.yellowWarm` | `colors.brand.yellowLight` |
| DeZoom | `/dezoom` | `colors.brand.red` | `colors.brand.redDark` | `colors.brand.redDeep` |

**Pattern lobby — 3 cards :**
- Card *Explication* → variante foncée
- Card *Créer une partie* → couleur principale
- Card *Rejoindre une partie* → variante claire

**Texte sur fond jaune :** utiliser `colors.ui.textPrimary` (foncé) et non `textOnColor` (blanc) — le jaune n'offre pas assez de contraste avec du texte blanc.

---

Disponibles dans `colors.types` — uniquement pour le mini-jeu "Quel est ce type ?".

```ts
colors.types.fire     // #FF9741
colors.types.electric // #FFD733
colors.types.grass    // #78C850
colors.types.ice      // #5ABCB5
// ... 18 types au total
```

---

### Couleurs d'état de jeu

```ts
colors.game.success      // #4CAF50 — bonne réponse
colors.game.error        // #DC0A2D — mauvaise réponse
colors.game.hint         // #FFCB05 — indice utilisé
colors.game.timerOk      // #78C850 — temps normal
colors.game.timerWarn    // #FFCB05 — temps réduit
colors.game.timerDanger  // #DC0A2D — urgence
```

---

## Typographie

### Règle fondamentale

Deux polices uniquement. Chargées via Google Fonts dans `index.html`.

| Rôle | Police | Variable CSS | Classe Tailwind |
|---|---|---|---|
| Titres principaux | **Bangers** | `--font-display` | `font-display` |
| Tout le reste | **Nunito** | `--font-body` | `font-body` (défaut sur `body`) |

---

### Hiérarchie

| Niveau | Police | Graisse | Classe Tailwind | Usage |
|---|---|---|---|---|
| `h1` / Display | Bangers | 400 (naturel) | `font-display tracking-wide` | Logo, titres de page, noms de jeux |
| `h2` / Section | Nunito | 800 ExtraBold | `font-body font-extrabold tracking-tight` | Titres de section (`<SectionTitle />`) |
| `h3` / Sous-section | Nunito | 700 Bold | `font-body font-bold` | Titres de carte, labels de groupe |
| `p` / Corps | Nunito | 400 Regular | `font-body` | Descriptions, paragraphes |
| UI | Nunito | 500–600 | `font-body font-medium` ou `font-semibold` | Boutons, labels, inputs |
| Muted | Nunito | 400 | `font-body text-sm` | Aide, timestamps, texte secondaire |

---

### Exemples concrets

```tsx
// Titre de page
<h1 className="font-display text-4xl tracking-wide text-white uppercase">
  PokéGames
</h1>

// Titre de section (utiliser le composant <SectionTitle />)
<SectionTitle>Choisissez un mini-jeu</SectionTitle>
// → Nunito ExtraBold, uppercase, avec barre rouge à gauche

// Sous-titre de carte
<h3 className="font-body font-bold text-lg text-gray-900">Génération I</h3>

// Description
<p className="font-body text-gray-600 text-base leading-relaxed">
  Devinez le Pokémon à partir de sa description.
</p>

// Bouton
<button className="font-body font-semibold ...">C'est parti !</button>
```

> **Ne jamais mélanger les polices** : Bangers uniquement pour les gros titres impactants,
> Nunito pour tout ce qui doit être lu confortablement.

---

## Layout

### Structure globale (`App.tsx`)

```
DiagonalBackground (fond animé)
└── div.flex-1.flex
    ├── Sidebar (w-20, colors.brand.red, fixe gauche)
    └── div.flex-1.flex.flex-col  [borderColor: colors.brand.redDark]
        ├── TopBar (h-20, colors.brand.redDark)
        └── main.flex-1.p-4.md:p-8.overflow-auto
            └── <Pages />
```

La bordure rouge (`border-4 md:border-8`) encadre tout le contenu : ne jamais la supprimer.

### Pages — conteneur

```tsx
// Page standard
<div className="space-y-6">
  {/* contenu */}
</div>

// Page centrée (formulaire, lobby)
<div className="max-w-md mx-auto mt-16">
  {/* formulaire */}
</div>
```

---

## Composants

### `<GameCard />` — Carte de mini-jeu

**Fichier :** `src/app/components/GameCard.tsx`

La prop `color` attend un **hex** (depuis `colors.brand`), appliqué en `style` inline.

```tsx
import { colors } from "../design/colors";

<GameCard
  title="PokéDesc"
  description="Devinez le Pokémon à partir d'une description."
  color={colors.brand.blue}
  to="/lobby-pokedesc"
/>

<GameCard
  title="Quel est ce type ?"
  description="Devinez la paire de types."
  color={colors.brand.yellow}
  to="/types"
/>

<GameCard
  title="DeZoom"
  description="Devinez le Pokémon à partir d'une image zoomée."
  color={colors.brand.red}
  to="/dezoom"
/>
```

Style : `rounded-3xl`, `shadow-lg`, hover lift (`hover:-translate-y-1`), titre en `font-display`.

---

### `<SectionTitle />` — Titre de section

**Fichier :** `src/app/components/SectionTitle.tsx`

```tsx
<SectionTitle>Choisissez un mini-jeu</SectionTitle>
```

Rendu : barre verticale `colors.brand.redDark` + Nunito ExtraBold uppercase.
Ne pas recréer ce pattern manuellement — toujours utiliser ce composant.

---

### `<Sidebar />` — Navigation latérale

**Fichier :** `src/app/components/Sidebar.tsx`

| État | Style |
|---|---|
| Fond | `colors.brand.red` (inline style) |
| Bouton actif | `bg-white shadow-md scale-110` |
| Bouton inactif | `bg-pokered hover:bg-pokered-dark` |
| Icônes | `w-14 h-14 rounded-2xl` |

---

### `<TopBar />` — Barre du haut

**Fichier :** `src/app/components/TopBar.tsx`

| Propriété | Valeur |
|---|---|
| Fond | `colors.brand.redDark` (inline style) |
| Bordure basse | `colors.brand.redDeep` (inline style) |
| Hauteur | `h-20` |
| Titre | Bangers, `text-3xl tracking-wide uppercase` |

---

### `<Pokeball />` — Logo / hamburger

**Fichier :** `src/app/components/Pokeball.tsx`

```tsx
<Pokeball />                         {/* décoratif */}
<Pokeball onClick={handleToggle} />  {/* bouton hamburger mobile */}
```

Rouge haut de la Pokéball : `colors.brand.pokeballRed`. Animation hover : `hover:rotate-12`.

---

## Patterns de boutons

### Bouton primaire — sur fond coloré (GameCard)

```tsx
<button className="font-body font-semibold px-8 py-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105">
  Action
</button>
```

### Bouton primaire — sur fond blanc

```tsx
import { colors } from "../design/colors";

<button
  className="font-body font-semibold w-full py-3 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
  style={{ backgroundColor: colors.brand.red }}
>
  Action
</button>
```

> **Ne jamais utiliser `blue-600` comme couleur d'action principale.** Rouge Pokémon uniquement.

### Bouton secondaire / annulation

```tsx
<button
  className="font-body font-semibold px-6 py-2.5 bg-red-50 text-red-600 border-2 rounded-xl hover:bg-red-100 transition"
  style={{ borderColor: colors.brand.red }}
>
  Annuler
</button>
```

---

## Patterns de cartes (panneaux)

### Carte neutre (formulaire, info)

```tsx
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  {/* contenu */}
</div>
```

Hover sur cartes cliquables : `hover:-translate-y-0.5 hover:shadow-md transition`.

### Cartes de statut

```tsx
{/* Succès */}
<div className="font-body bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-xl">
  Bonne réponse !
</div>

{/* Erreur */}
<div className="font-body bg-red-50 border px-4 py-3 rounded-xl" style={{ color: colors.game.error, borderColor: colors.game.error + "33" }}>
  Mauvaise réponse.
</div>

{/* Indice */}
<div className="font-body bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-3 rounded-xl">
  Indice révélé.
</div>
```

---

## Patterns d'inputs

```tsx
<input
  className="font-body w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 transition"
  style={{ '--tw-ring-color': colors.brand.blue + '33' } as React.CSSProperties}
/>

{/* État erreur */}
<input className="font-body ... border-red-500" />
<p className="font-body text-sm mt-1" style={{ color: colors.game.error }}>
  Message d'erreur
</p>
```

---

## Principes généraux

1. **Couleurs** — toujours depuis `colors.ts`, jamais de hex brut dans les composants.
2. **Typographie** — Bangers pour les gros titres impactants, Nunito pour tout le reste.
3. **Arrondis** — `rounded-xl` (panneaux), `rounded-3xl` (GameCards), `rounded-full` (pilules/boutons).
4. **Ombres** — `shadow-sm` (repos) → `shadow-md` (hover) → `shadow-lg` (GameCard).
5. **Hover** — `hover:-translate-y-0.5` ou `-translate-y-1` (lift), `hover:scale-105` (boutons icône).
6. **Transitions** — `transition-all duration-200` (boutons) ou `duration-300` (cartes).
7. **Responsive** — toujours prévoir `md:` pour les paddings (`p-4 md:p-8`) et tailles de texte.
8. **Fond diagonal** — toujours via `useBackgroundStore` + `colors.ui.bg*`, jamais hardcodé.
