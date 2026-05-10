/**
 * PokéGames — Palette de couleurs officielle
 * ==========================================
 * Direction artistique : inspirée de l'univers Pokémon classique (Gen I–IV),
 * style pixel art + coloré + légèrement sombre. Rouge Pokéball dominant,
 * jaune Pokémon en accent, bleu Pokédex pour la variété.
 *
 * Règle d'usage :
 *  - Toujours utiliser ces tokens plutôt que des valeurs brutes dans les composants.
 *  - Les couleurs Tailwind correspondantes sont définies dans theme.css (`@theme`).
 *  - Pour les classes dynamiques (ex. GameCard), utiliser les valeurs de ce fichier
 *    via `style={{ backgroundColor: colors.brand.red }}` ou via les classes Tailwind
 *    mappées (bg-pokered, bg-pokeyellow, bg-pokeblue…).
 */

export const colors = {

  // ─── Couleurs de marque ────────────────────────────────────────────────────
  // Le trio iconique de l'univers Pokémon officiel.

  brand: {

    white : "#FFFFFF",
    /** Rouge vif — spécifique à la Pokéball décorative (SVG/composant Pokeball) */
    pokeballRed: "#FF0000",
    /** Rouge Pokéball (survol, bordures actives, TopBar) */
    red:      "#CC0000",
    /** Rouge foncé (fond sidebar, boutons nav inactifs) */
    redDark:  "#A30000",
    /** Rouge très foncé (hover buttons, ombre portée) */
    redDeep:  "#750000",

    redLight: "#FF2E2E",

    /** Jaune Pokémon (accent, highlights, badges) */
    yellow:   "#FFCF1A",
    /** Jaune chaud — variante légèrement dorée */
    yellowWarm: "#FFC800",

    yellowLight: "#FFE32E",

    yellowDark: "#CC9A00",

    /** Bleu Pokédex (carte PokéDesc, éléments secondaires) */
    blue:     "#3B4CCA",
    /** Bleu foncé — hover ou ombre du bleu Pokédex */
    blueDark: "#2D3BA4",
    /** Bleu clair — pour les éléments décoratifs ou les fonds secondaires (ex. diagonal stripe) */
    blueLight: "#5B69D2",

    blueDeep: "#19215C",

    green: '#2A8C2D',
    greenDark: '#1B5A1D',
    greenLight: '#30A134',
    greenDeep: '#103712',

  },

  // ─── Interface utilisateur ─────────────────────────────────────────────────
  // Couleurs fonctionnelles pour la structure de l'app.

  ui: {
    /** Fond principal (mode clair) */
    background:  "#FFFFFF",
    /** Fond de page côté gauche (diagonal) */
    bgLeft:      "#FFFFFF",
    /** Bande diagonale centrale */
    bgStripe:    "#A6ACAF",
    /** Fond de page côté droit */
    bgRight:     "#BDC3C7",

    /** Fond de page côté gauche — pages de jeu (PokéDesc, Partie) */
    bgLeftGame:   "#FFFFFF",
    /** Bande diagonale centrale — pages de jeu */
    bgStripeGame: "#2E3DA0",
    /** Fond de page côté droit — pages de jeu */
    bgRightGame:  "#3B4CCA",

    /** Bordure principale de l'interface (contour de la zone de jeu) */
    border:      "#B3000C",

    /** Texte principal */
    textPrimary: "#1A1A2E",
    /** Texte secondaire / sous-titres */
    textMuted:   "#4C4C57",
    /** Texte sur fond coloré (rouge, bleu) */
    textOnColor: "#FFFFFF",
    /** Texte sur fond coloré, légèrement transparent */
    textOnColorSoft: "rgba(255,255,255,0.9)",

    /** Surface de carte / panneau */
    surface:     "#FFFFFF",
    /** Surface sombre (mode dark futur) */
    surfaceDark: "#1A1A2E",

    /** Overlay sombre (modal, backdrop mobile) */
    overlay:     "rgba(0,0,0,0.5)",
    /** Décoration semi-transparente (Pokéball sur GameCard) */
    decorOverlay: "rgba(0,0,0,0.1)",
    /** Gris rétro pour UI (ajoutés pour la sidebar rétro) */
    grayLight:   "#DBDBDB",
    grayMid:     "#CBCBCB",
    grayDark:    "#ADADAD",
    grayBorderLight: "#DFDFDF",
    grayBorderDark:  "#585858",
    grayShadow:  "#303030",
    grayActive:  "#A0A0A0",
  },

  // ─── Types Pokémon ─────────────────────────────────────────────────────────
  // Couleurs officielles des 18 types — utilisées dans le mini-jeu "Types".
  // Source : palette officielle des jeux Pokémon (DS/3DS era).

  types: {
    normal:   "#A8A878",
    fire:     "#FF9741",   // Orange vif — icône flamme
    water:    "#6890F0",   // Bleu ciel — icône goutte
    electric: "#FFD733",   // Jaune électrique — icône éclair
    grass:    "#78C850",   // Vert — icône feuille
    ice:      "#5ABCB5",   // Turquoise — icône flocon
    fighting: "#C03028",
    poison:   "#A040A0",
    ground:   "#E0C068",
    flying:   "#A890F0",
    psychic:  "#F85888",
    bug:      "#A8B820",
    rock:     "#B8A038",
    ghost:    "#705898",
    dragon:   "#7038F8",
    dark:     "#705848",
    steel:    "#B8B8D0",
    fairy:    "#EE99AC",
  },

  // ─── États de jeu ──────────────────────────────────────────────────────────
  // Feedback visuel pendant les parties.

  game: {
    /** Bonne réponse */
    success: "#30A134",
    /** Mauvaise réponse */
    error:   "#DC0A2D",
    /** Indice / neutre */
    hint:    "#FFCB05",
    /** Timer — temps restant normal */
    timerOk:     "#78C850",
    /** Timer — temps bientôt écoulé */
    timerWarn:   "#FFCB05",
    /** Timer — urgence */
    timerDanger: "#DC0A2D",
  },

} as const;

/** Type utilitaire pour accéder aux valeurs de couleur */
export type ColorValue = typeof colors;
