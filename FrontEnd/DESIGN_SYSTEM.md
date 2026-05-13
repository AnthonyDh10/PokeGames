

---

# Design PokéDesc — Mini-jeu de référence

> Ce mini-jeu sert de **référence canonique** pour tous les autres jeux (Types, DeZoom).
> Son design complet (lobby, interface de jeu, résultats) doit être reproduit à l'identique en changeant seulement la couleur thématique.

---

## Couleurs thématiques PokéDesc

| Rôle | Token | Usage concret |
|---|---|---|
| Principale | `colors.brand.blue` | Fond des boutons actifs, header des Cards, titre des sections |
| Foncée | `colors.brand.blueDark` | Hover des PixelButtons, label joueur gagnant dans HPBar, texte secondaire |
| Claire | `colors.brand.blueLight` | Bordure lumière des PixelButtons, décor Pokéball des Cards |
| Très foncée | `colors.brand.blueDeep` | Bordure extérieure des Cards, bordure des PixelButtons, fond SubCard code session |
| Texte sur fond | `#ffffff` (littéral) | Texte dans headers colorés — ok car jamais changé indépendamment |


---

## 1. Lobby (`LobbyPokedescPage` + `LobbyPage`)

### Structure générale

Le lobby est rendu par le composant générique `<LobbyPage>` qui prend un `theme` et un `settingsPanel`. La page `LobbyPokedescPage` n'est responsable que du panneau de paramètres spécifique.

**Thème passé à `<LobbyPage>` :**

```ts
const THEME = {
  primary:      colors.brand.blue,
  primaryLight: colors.brand.blueLight,
  primaryDark:  colors.brand.blueDark,
  borderColor:  colors.brand.blueDeep,
  textOnColor:  '#ffffff',
}
```

### État 0 — Saisie du pseudo

Affiché si `playerName` est vide. Centré dans `max-w-md mx-auto mt-16`.

| Élément | Détail |
|---|---|
| Card header | `headerColor: theme.primary` (`brand.blue`), Pokéball `theme.primaryDark` |
| Titre | `font-display text-2xl tracking-wide`, texte blanc, "Bienvenue !" |
| Sous-titre | `font-heading`, blanc, opacity 0.8, "Choisissez un pseudo pour jouer" |
| Input | `SubCard` enveloppante — `borderColor: colors.ui.grayMid`, `bodyColor: brand.white` ; input `font-heading`, `py-3 px-4`, `bg-transparent focus:outline-none` |
| Bouton | `<PixelButton>` pleine largeur, `colorBorder: theme.borderColor`, `colorLight: theme.primaryLight`, `colorDark: theme.primaryDark`, `color: theme.primary` ; label "Continuer" en blanc, désactivé si champ vide |

### État 1 — Sélection de partie (avant création)

Disposition en 2 colonnes sur desktop (`grid-cols-1 md:grid-cols-3`) via `LobbyPage` :

#### Colonne gauche + centre : Explication du jeu

Card avec `headerColor: theme.primary` (`brand.blue`), fond `brand.white`, Pokéball décorative `theme.primaryDark`.

- Header : image du perso Red animé (`red-gif.gif`) + titre du jeu en `font-display text-2xl tracking-wide` blanc
- Corps : texte passé via prop `explanationText` — `font-heading text-lg text-center`, couleur `colors.ui.textPrimary`
- Pour PokéDesc : "Face à toi, une description d'un pokémon s'affiche. Devine de quel pokémon il s'agit ! Tu as le droit à 3 essais et des indices pour t'aider !"

#### Colonne droite : Panneau de paramètres (`LobbyPokedescPage.settingsPanel`)

Card avec `pokeballColor: brand.blue`. Padding `p-6`.

**En-tête du panneau :**
- Icône ⚙️ + titre `"Paramètres de la partie"` en `font-heading text-xl tracking-wide`, couleur `colors.ui.textPrimary`
- Si Joueur 2 (lecture seule) : badge `<SubCard>` — `bodyColor: #f3f4f6`, `borderColor: #d1d5db`, texte "Lecture seule" en gris `text-xs font-heading`

**Nombre de Pokémon (1 → 6) :**
- Label : `font-heading text-sm font-medium`, couleur `colors.ui.textMuted` + valeur en `font-bold brand.blue`
- Boutons : rangée de 6 `<SubCard>` cliquables, pleine largeur (`flex-1`)
  - **Inactif** : `bodyColor: #ffffff`, `borderColor: #e5e7eb`, texte `colors.ui.textMuted`
  - **Actif** : `bodyColor: brand.blue`, `borderColor: brand.blueDark`, texte blanc
  - Hover (si Player 1) : `hover:-translate-y-0.5 transition`
  - Désactivé (si Player 2) : `cursor-not-allowed opacity-70`

**Durée du timer (30s / 60s / 120s / ♾️) :**
- Même structure que "Nombre de Pokémon" — 4 boutons `<SubCard>`
- Valeur -1 affichée comme "♾️" dans le bouton et "Infini" dans le label

**Générations (1 → 8) :**
- Label + liens "Tout sélectionner" (`color: brand.blue`, `text-xs`, `hover:underline`) / "Tout désélectionner" (gris)
- Grille `grid-cols-2 sm:grid-cols-4 gap-2` de `<SubCard>` cliquables
  - **Inactif** : `bodyColor: #ffffff`, `borderColor: #e5e7eb`, texte `colors.ui.textMuted`
  - **Actif** : `bodyColor: brand.blue`, `borderColor: brand.blueDark`, texte blanc
  - Label : "Gén. N" en `font-heading text-sm font-semibold`
- Si sélection partielle : compteur `font-heading text-xs`, couleur `colors.ui.textMuted`

**Boutons principaux (Créer / Rejoindre) :**
- `<PixelButton>` de taille `h-12`, pleine largeur
- **Créer une partie** : `color: theme.primary`, `colorLight: theme.primaryLight`, `colorDark: theme.primaryDark`, `colorBorder: theme.borderColor`
- **Rejoindre** : même palette que Créer
- Label : `font-heading font-semibold text-white`
- Champ code session : `<SubCard>` wrappant un `<input>` `font-heading`, `px-4 py-3`, `bg-transparent focus:outline-none` — `borderColor: colors.ui.grayMid`

### État 2 — Salle d'attente (`currentPartieId && partie`)

Card avec `headerColor: theme.primary` (`brand.blue`), `pokeballOpacity: 0`.

**Header de la card :**
- Titre : `font-display text-2xl text-center tracking-wide`, blanc — "Salle d'attente / [Nom du jeu]"
- Sous-titre : `font-heading text-sm`, blanc opacity 0.8 — "Partage ce code pour inviter ton ami..."
- Code session : `<SubCard>` avec `borderColor: brand.white`, `bodyColor: theme.primaryLight` (`brand.blueLight`)
  - Contenu : code en `font-display text-xl tracking-widest` blanc + bouton 📋 (`hover:scale-110 active:scale-95`)

**Corps de la card :**
- Pokéball décorative centrale : taille 280, opacity 0.1, couleur `theme.primary`, positionnée absolue centrée
- Grille 2 joueurs avec "VS" au centre :
  - **Joueur actif** (soi) : `<SubCard>` `borderColor: theme.primary` (`brand.blue`)
  - **Joueur absent / adversaire** : `<SubCard>` `borderColor: colors.ui.grayMid (#e5e7eb)`
  - Joueur présent : sprite `red-gif.gif` ; en attente : `ditto-gif.gif` + texte "En attente..."
  - Pseudo : `font-heading font-semibold text-gray-800`
- Si Joueur 2 connecté : badge "✓ PRÊT" en `<SubCard>` `bodyColor: brand.blue` texte blanc, coin haut-droit

**Boutons de démarrage :**
- "Jouer en solo" + "Démarrer (multi)" si Joueur 1
- "En attente que l'hôte démarre..." si Joueur 2
- Boutons `<PixelButton>` mêmes couleurs que plus haut

---

## 2. Interface de jeu (`PokeDescPage`)

### Header (`<PokeDescHeader>`)

`<Card>` avec `headerColor: colors.brand.blue`, `headerClassName: "py-4"`, `pokeballOpacity: 0.1`, `pokeballColor: brand.blue`.

**Header de la Card :**
- Titre : `font-display text-xl md:text-2xl tracking-wide`, couleur `colors.ui.textOnColor` (blanc) — "Devine le Pokémon !"
- Générations : `font-heading text-xl md:text-2xl tracking-wide`, `colors.ui.textOnColorSoft` (blanc 90%) — format "Gen I, II, III..." (desktop) ou abrégé (mobile)

**Corps de la Card (padding `p-4 md:p-6`) :**

Disposition flex `flex-col md:flex-row justify-between items-center gap-6`.

Bloc gauche — Score + Tentatives :
- `<HPBar>` sur `w-full sm:w-56 md:w-64` (voir section HPBar plus bas)
- Tentatives : label `font-heading font-semibold`, couleur `brand.blueDark` + 3 images Pokéball (`pokéball_face.png`, `w-12 h-10`) — grisées (`grayscale`) si la tentative est utilisée

Bloc droit — Timer (`<Timer>`) :
- Label "Temps :" : `font-heading text-sm text-gray-500`
- Valeur : `font-heading font-semibold text-lg`
- Couleur dynamique selon temps restant :
  - `> 20s` → `colors.game.timerOk` (vert)
  - `10–20s` → `colors.game.timerWarn` (jaune)
  - `≤ 10s` → `colors.game.timerDanger` (rouge)
  - Mode chronomètre (infini) → `#6B7280` (gris neutre)
- Timer infini affiché : `"♾️"`
- Animation `shake` (secousse horizontale ±3px) si temps critique
- Animation `flashRed` (fond rouge transparent) si pénalité
- Badge pénalité : `-Ns` flottant vers le haut, texte rouge, `animate-[timerFloatUp_1.5s_ease-out_forwards]`

### Corps de jeu (grille 2 colonnes : `grid md:grid-cols-2 gap-4`)

#### Colonne gauche — Description + Réponse

**`<DescriptionCard>` :**
- `<Card>` `pokeballColor: brand.blueLight`, `pokeballOpacity: 0.1`, `showHeader: false`
- Titre section : "DESCRIPTION" en `font-heading text-center text-xl tracking-wide`, couleur `brand.blue`
- Texte : `font-heading text-justify p-8 text-base leading-relaxed`, couleur par défaut
- Hauteur minimale : `min-h-[160px] md:min-h-[220px]`
- Pagination : boutons `◀` et `▶` `font-heading text-xl`, couleur `brand.blue`, `hover:-translate-y-0.5`
- Compteur : `font-heading text-sm text-gray-500 tabular-nums` ex. "2 / 4"
- Bouton Zoom 🔍 : `font-heading w-9 h-9`, couleur `brand.blue`, `hover:-translate-y-0.5`, affiché à droite

**`<AnswerCard>` :**
- `<Card>` `showHeader: false`
- Bulle Prof. Chen (visible uniquement sur mauvaise réponse) :
  - Positionnée absolue à gauche de la card (`right-full mr-6 w-64 md:w-72 z-50`)
  - Flèche triangulaire droite (double couche CSS border trick) — bordure `#1f2937`, fond blanc
  - `<SubCard>` `bodyColor: brand.white`, `borderColor: brand.blueDeep`, `borderThickness: p-[4px]`, `p-4 flex gap-3 items-start`
  - Sprite Prof. Chen `w-10 h-10` + nom "PROF. CHEN" en `font-display font-bold tracking-wider`
  - Message d'erreur en `font-heading text-sm`, couleur `brand.red`
  - Badges de proximité inline :
    - "Types exacts" → `bg-green-100 text-green-800 border border-green-200`
    - "1 Type en commun" → `bg-blue-100 text-blue-800 border border-blue-200`
    - "Même Génération" → `bg-yellow-100 text-yellow-800 border border-yellow-200`
    - "Même Famille" → `bg-purple-100 text-purple-800 border border-purple-200`
    - Style commun : `text-[10px] px-1.5 py-0.5 font-heading font-bold uppercase tracking-wide`
- Input de recherche : `<PokemonSearchInput>` (voir composant dédié)
- Bouton Valider : `<PixelButton>` `color: brand.blue`, `colorLight: brand.blueLight`, `colorDark: brand.blueDark`, `colorBorder: brand.blueDeep`, désactivé si aucun Pokémon sélectionné ou soumission en cours

#### Colonne droite — Grille d'indices (`<HintsGrid>`)

`<Card>` `showHeader: false`, `pokeballOpacity: 0`.

- Titre : "INDICES DISPONIBLES" en `font-heading text-center text-xl tracking-wide`, couleur `brand.blue`
- Grille : `grid-cols-2 sm:grid-cols-3 gap-3`

Chaque indice est un `<PixelButton>` `clipPath: pixelClipPathSm` (`min-h-24`), états :

| État | `colorBorder` | `colorLight` | `colorDark` | `color` |
|---|---|---|---|---|
| **Disponible** | `brand.blueDeep` | `#FFFFFF` | `#E7E7E7` | `#F9FAFB` |
| **Utilisé** | `brand.blueDeep` | `brand.blueLight` | `brand.blueDark` | `brand.blue` |
| **Verrouillé** | `#9CA3AF` | `#F1F2F4` | `#BEC3CB` | `#D7DADF` |

Contenu du bouton (state disponible/verrouillé) :
- Icône emoji ou image `w-8 h-8 grayscale opacity-70`
- Label texte `text-sm text-gray-700`
- Si verrouillé : badge 🔒 `absolute top-1 right-1`, fond `gray-400`, texte blanc, `w-5 h-5 rounded-full`

Contenu du bouton (state utilisé — valeur révélée) :
- Texte : `font-heading font-semibold`, couleur `brand.white`, `text-sm` (ou `text-xs` pour Stats)
- Sprite (indice "Silhouette") : `<img>` `imageRendering: pixelated`, `filter: brightness(0)` (silhouette noire)

Badge pénalité temps : `-Ns` flottant, `absolute -top-6`, `text-red-500 font-bold text-lg`, fond `white/95`, bordure rouge, `animate-[hintFloatUp_1.5s_ease-out_forwards]`

### `<HPBar>` — Barre de vie style GBA

Utilisée dans le header de jeu ET dans les résultats.

- Label joueur : `font-heading truncate uppercase tracking-widest`
  - Gagnant : `font-bold`, `font-size: 1.2rem`, couleur `brand.yellowWarm`
  - Normal : `font-size: 1rem`, couleur `brand.blueDark`
- Score numérique : `font-heading text-lg tabular-nums tracking-tighter` — valeur `text-slate-800` / max `text-slate-500 text-xs`
- Conteneur barre : `<SubCard>` `borderColor: #0f172a`, `bodyColor: #1e293b`, `p-[2px]`, `px-1.5 py-1.5`
  - Label "HP" : `text-[12px] font-display text-orange-400`
  - Fond de barre : `flex-1 h-4 bg-slate-700` + `border-l-2 border-slate-900`
  - Remplissage (motion) : `initial: width 0`, `animate: width %`, `transition: 1.5s easeOut`
  - Couleur dynamique (gradient `to bottom`, 65% clair / 35% foncé) :
    - `> 50%` → clair `#22c55e` / foncé `colors.game.success`
    - `20–50%` → clair `brand.yellowLight` / foncé `brand.yellowWarm`
    - `≤ 20%` → clair `brand.red` / foncé `brand.redDark`

---

## 3. Résultats (`ResultatsPage` + `GameResultsLayout`)

### Layout global (`<GameResultsLayout>`)

`max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8`

Grille `grid-cols-1 lg:grid-cols-[4fr_6fr] gap-6 md:gap-8 items-start` :
- **Colonne gauche (40%)** : Card header + Scores
- **Colonne droite (60%)** : Détails (carousel + stats)
- **Ligne du bas** : Actions (pleine largeur)

### Card header résultats

`<Card>` `headerClassName: "py-4"`, `pokeballColor: brand.blue`, `pokeballSize: 200`, `bodyColor: brand.blue`.

- Titre : `font-display text-2xl md:text-3xl tracking-wide bold`, couleur `brand.white` — "Résultats"
- Code session : `font-heading text-sm`, couleur `brand.white`

### Section scores (`<FinalScoreBars>`)

`<Card>` `borderColor: brand.blueDeep`, `border-4`, `bg-slate-50`, `pokeballOpacity: 0`, `shadow-[8px_8px_0px_rgba(0,0,0,0.1)]`.

- Titre : "SCORES FINAUX" en `font-heading text-center text-xl uppercase tracking-widest`, couleur `brand.blueDark`
- Conteneur : `flex flex-col gap-10 max-w-xl mx-auto`
- 1 ou 2 `<HPBar>` (solo = 1, multi = 2)

### Section carrousel Pokémon

`<Card>` `pokeballOpacity: 0`, `bg-slate-50 border-4`, `borderColor: brand.blueDeep`.

**Titre :** "RÉCAPITULATIF DE LA PARTIE" — `font-heading text-center text-xl uppercase tracking-tighter`, couleur `brand.blueDark`

**Carrousel (framer-motion) :**
- Conteneur : `relative flex items-center justify-center min-h-[180px]`
- Boutons navigation `◀` / `▶` : `absolute left-4`/`right-4`, `text-3xl`, couleur `brand.blueDark`, `hover:scale-125 transition-transform select-none`
- Items (3 visibles max — précédent / actif / suivant) :
  - **Actif** : `scale: 1.3`, `opacity: 1`, `blur(0px)`, `zIndex: 10`, `x: 0`
  - **Adjacent** : `scale: 0.7`, `opacity: 0.2`, `blur(2px)`, `zIndex: 5`, `x: ±120`
  - Transition : `duration: 0.4s`
  - Sprite : `w-32 h-32 mx-auto drop-shadow-md`, `imageRendering: pixelated`
  - Nom (actif uniquement) : `font-display uppercase mt-2 text-lg tracking-widest`, couleur `brand.blueDark`

**Séparateur style RPG :** `h-1 w-full bg-slate-200 mb-8`

**Stats par joueur :**
- Grille `grid gap-6` — `max-w-md mx-auto` si solo, `grid-cols-2` si multi
- Joueur 2 : séparé par `border-l-2 border-slate-100 pl-6`
- Label joueur : `font-display text-xs py-1 px-3 uppercase tracking-wider`, couleur `brand.blueDark` (J1) ou `brand.yellowWarm` (J2)

**`<StatDetails>` par joueur :**
- En-tête score : `flex justify-between border-b-4 border-dashed pb-2`, `borderColor: color` (bleu J1, jaune J2)
  - Statut : "► RÉUSSI" vert ou "X ÉCHEC" rouge, `font-bold text-sm font-heading uppercase tracking-widest`
  - Points : `text-2xl font-bold`, couleur thématique + `<small> text-xs` "PTS"
- Grille 2 stats (`grid-cols-2 gap-4`) :
  - "TENTATIVE(S)" et "INDICE(S) UTILISÉ(S)" — style "boîte RPG" :
    - `p-2 bg-white border-2`, `borderColor: color`
    - `boxShadow: 3px 3px 0px {color}` (ombre portée solide)
    - `hover:-translate-y-0.5 transition`
    - Label : `text-[10px] text-gray-500 mb-1 font-heading uppercase tracking-widest`
    - Valeur : `font-bold text-lg text-gray-800`
- Indices utilisés : badges `text-[10px] px-2 py-1 bg-gray-100 border-2 border-gray-800 text-gray-700 font-bold` — format `[Nom de l'indice]`

### Section actions (`<ResultsActions>`)

Liste de `<PixelButton>` pleine largeur, style menu RPG.

Boutons disponibles selon contexte :
| Bouton | Condition | Label |
|---|---|---|
| RELANCER | Solo + partie terminée | "RELANCER" / "LANCEMENT..." |
| REVANCHE | Multi + les deux terminés | "REVANCHE" / "EN ATTENTE..." |
| NOUVELLE PARTIE | Toujours | "NOUVELLE PARTIE" / "CRÉATION..." |
| MENU PRINCIPAL | Toujours | "MENU PRINCIPAL" |

Couleurs des `<PixelButton>` :
- `color: buttonColor` (`brand.blue`)
- `colorLight: buttonColorLight` (`brand.blueLight`)
- `colorDark: buttonColorDark` (`brand.blueDark`)
- `colorBorder: buttonColorBorder` (`brand.blueDeep`)
- "MENU PRINCIPAL" → `color: menuColor` (couleur secondaire ou gris neutre selon le jeu)

---

## 4. Modales de jeu

Toutes les modales partagent le même overlay : `fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4`.

### `<SuccessModal>` — Bonne réponse

`<Card>` `max-w-sm w-full`, `showHeader: true`.

| Propriété | Valeur |
|---|---|
| `headerColor` | `colors.game.success` (vert) |
| `pokeballColor` | `colors.game.success` |
| `pokeballOpacity` | `0.05` |
| `animation` | `true` (slide-in depuis le haut) |

- Titre header : "Bravo !" — `font-display text-xl tracking-wide text-white text-center`
- Texte intro : "C'était bien :" — `font-heading font-bold text-lg`, couleur `colors.ui.textMuted`
- Sprite : `w-64 h-64`, `imageRendering: pixelated`, animation `spriteReveal 0.8s ease-out`
- Nom du Pokémon : `font-heading font-bold font-size: 1.5rem`, couleur `colors.game.success`
- Bouton : `<PixelButton>` `h-12 w-full`, `color: brand.blue`, `colorLight: brand.blueLight`, `colorDark: brand.blueDark`, `colorBorder: brand.blueDeep`
  - Label : "Pokémon suivant" ou "Terminer la partie"

### `<FailureModal>` — Mauvaise réponse / Timeout

Identique à `SuccessModal` mais :

| Propriété | Valeur |
|---|---|
| `headerColor` | `colors.game.error` (rouge) |
| `pokeballColor` | `colors.game.error` |
| Titre | "Dommage !" ou "Temps écoulé !" (si `isTimeout`) |
| Texte intro | "C'était :" |
| Couleur nom | `colors.game.error` |
| Bouton | `color: brand.red`, `colorDark: brand.redDark`, `colorLight: brand.redLight`, `colorBorder: brand.redDeep` |

### `<ZoomDescriptionModal>`

`<Card>` centrée `max-w-2xl w-full`, affiche la description en grand.
- Bouton fermer : en haut à droite, `font-heading`, couleur `brand.blue`
- Même pagination `◀` / `▶` que `<DescriptionCard>`

---

## 5. Composants utilitaires — rappel design

### `<Card>` — Conteneur principal

Forme pixelisée via `clip-path` CSS (coins "coupés" en escalier de 16px / 4 marches).

Props clés :
- `headerColor` : fond du header (bande colorée en haut)
- `bodyColor` : fond du corps (défaut `brand.white`)
- `borderColor` : bordure extérieure (wrapper du clip-path)
- `borderThickness` : padding du wrapper (défaut `p-1.5`)
- `pokeballColor` + `pokeballOpacity` + `pokeballSize` : décor Pokéball semi-transparent en bas à droite
- `animation: true` : apparition slide-in depuis le haut (framer-motion)
- `hoverable: true` : lift au hover + ombre renforcée

### `<SubCard>` — Conteneur secondaire

Même système clip-path en taille réduite (coins 3px). Utilisé pour les badges, inputs, options, code session.

Props : `bodyColor`, `borderColor`, `borderThickness`, `className`.

### `<PixelButton>` — Bouton principal

Rendu en 4 couches superposées (clip-path `pixelClipPathLg` ou `pixelClipPathSm`) :
1. Couche extérieure : `colorBorder` (contour)
2. Couche lumière : `colorLight` (haut + gauche)
3. Couche ombre : `colorDark` (bas + droite)
4. Fond interne : `color`

Comportement :
- Au repos : `drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)]`
- Hover : `drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] translate-x-[2px] translate-y-[2px]`
- Active : `drop-shadow-none translate-x-[4px] translate-y-[4px]`
- Désactivé : `opacity-90 translate-x-[2px] translate-y-[2px]`, ombre réduite

`pixelClipPathLg` : coins 9px (boutons principaux, Card)
`pixelClipPathSm` : coins 3px (indices, petits boutons)

---

## 6. Plan d'adaptation — Types et DeZoom

Le design PokéDesc est entièrement paramétré par `theme`. Pour implémenter un nouveau jeu, il suffit de :

### Étape 1 — Créer le fichier `LobbyXxxPage.tsx`

Copier `LobbyPokedescPage.tsx`. Modifier :
- Le `THEME` objet avec les couleurs du jeu
- La prop `gameRoute` passée à `<LobbyPage>` (ex: `"/types"` ou `"/dezoom"`)
- Le `explanationText` (texte d'explication spécifique)
- Le `settingsPanel` si le jeu a des paramètres différents (ou l'omettre)

### Étape 2 — Créer la page de jeu `XxxPage.tsx`

Reprendre la structure de `PokeDescPage.tsx` :
- `<PokeDescHeader>` → créer un équivalent `<XxxHeader>` ou réutiliser avec des props différentes
- `<DescriptionCard>` → remplacer par le composant central du jeu (image zoomée, paires de types...)
- `<AnswerCard>` → adapter à la mécanique de réponse du jeu
- `<HintsGrid>` → conserver ou retirer selon le jeu

### Étape 3 — Créer la page résultats `ResultatsXxxPage.tsx`

Reprendre `ResultatsPage.tsx`. Modifier uniquement :
- `buttonColor`, `buttonColorDark`, `buttonColorLight`, `buttonColorBorder` passés à `<ResultsActions>`
- `pokeballColor` passé à `<GameResultsLayout>`
- `bodyColor` du header Card
- Les couleurs dans `<FinalScoreBars>` et `<StatDetails>` (J1 = couleur thème, J2 = `brand.yellowWarm`)

### Correspondance de tokens par jeu

| Rôle | PokéDesc | Types | DeZoom |
|---|---|---|---|
| Principale | `brand.blue` | `brand.yellow` | `brand.red` |
| Foncée | `brand.blueDark` | `brand.yellowWarm` | `brand.redDark` |
| Claire | `brand.blueLight` | `brand.yellowLight` | `brand.redLight` |
| Très foncée (bordure) | `brand.blueDeep` | `brand.yellowDark` | `brand.redDeep` |
| Texte sur fond | `#ffffff` | `colors.ui.textPrimary` ⚠️ | `#ffffff` |
| Fond diagonal stripe | `brand.blueDark` | `brand.yellowWarm` | `brand.redDark` |
| Fond diagonal right | `brand.blue` | `brand.yellow` | `brand.red` |

> ⚠️ **Types uniquement :** le jaune n'offre pas assez de contraste avec du texte blanc. Utiliser `colors.ui.textPrimary` (foncé) pour le texte dans les headers et boutons sur fond jaune.

### Étape 4 — Brancher les routes

Dans `App.tsx`, ajouter :
```tsx
<Route path="/lobby-types" element={<LobbyTypesPage />} />
<Route path="/types/:partieId" element={<TypesPage />} />
<Route path="/resultats-types/:partieId" element={<ResultatsTypesPage />} />

<Route path="/lobby-dezoom" element={<LobbyDeZoomPage />} />
<Route path="/dezoom/:partieId" element={<DeZoomPage />} />
<Route path="/resultats-dezoom/:partieId" element={<ResultatsDeZoomPage />} />
```

### Étape 5 — Mettre à jour les GameCards

Dans `HomePage.tsx`, mettre à jour les props `to` des `<GameCard>` pour pointer vers les nouveaux lobbies.
