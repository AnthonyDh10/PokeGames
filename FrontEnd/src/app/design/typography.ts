/**
 * PokéGames — Typographie officielle
 * ====================================
 * Direction artistique : style pixelisé moderne à 3 niveaux.
 *
 * Hiérarchie :
 *  - h1 / display  → Press Start 2P  → logo, titres principaux, codes de session
 *  - h2 / heading  → Pixelify Sans   → titres de carte, section headers, sous-titres
 *  - h3            → Pixelify Sans   → sous-sections, labels de carte
 *  - body / p      → Nunito Regular  → descriptions, paragraphes
 *  - ui / small    → Nunito Medium   → boutons, labels, inputs, badges
 *
 * Classes Tailwind disponibles (définies dans theme.css) :
 *  font-display  → Press Start 2P
 *  font-heading  → Pixelify Sans
 *  font-body     → Nunito (default sur <body>)
 *
 * Ombres pixel (définie dans theme.css @layer utilities) :
 *  shadow-px-sm / shadow-px / shadow-px-lg / shadow-px-xl  → box-shadow
 *  drop-px-sm / drop-px / drop-px-lg / drop-px-xl          → filter: drop-shadow (clip-path)
 *  text-shadow-px / text-shadow-px-sm                       → text-shadow
 *
 * Usage dans un composant :
 *  import { typography } from "../design/typography";
 *
 *  // Classe Tailwind (usage habituel)
 *  <h1 className="font-display text-xl tracking-wide">PokéGames</h1>
 *  <h2 className="font-heading text-2xl">Titre de carte</h2>
 *  <p className="font-body text-base">Description du Pokémon...</p>
 */

export const typography = {

  // ─── Familles de polices ───────────────────────────────────────────────────

  fonts: {
    /** Press Start 2P — logo, titres principaux, codes de session */
    display: '"Press Start 2P", monospace',
    /** Pixelify Sans — titres de carte, section headers, sous-titres */
    heading: '"Pixelify Sans", sans-serif',
    /** Nunito — tout le reste : corps, boutons, labels */
    body: '"Nunito", sans-serif',
  },

  // ─── Graisses ──────────────────────────────────────────────────────────────

  weights: {
    normal:    400,  // Texte courant, descriptions
    medium:    500,  // Labels, petits éléments UI
    semibold:  600,  // Tags, badges, éléments secondaires
    bold:      700,  // h3, titres de carte
    extrabold: 800,  // h2, titres de section
    black:     900,  // Accentuation extrême (rare)
  },

  // ─── Espacement des lettres ────────────────────────────────────────────────

  tracking: {
    display: '0.05em',  // Press Start 2P — un peu d'air pour la lisibilité
    heading: '0.01em',  // Pixelify Sans — légère aération
    body:    '0em',     // Normal
    ui:      '0.01em',  // Boutons / labels — micro-aération
  },

  // ─── Ombres pixel ─────────────────────────────────────────────────────────
  // Utiliser les classes CSS (shadow-px-sm / drop-px / etc.) plutôt que ces valeurs.

  shadows: {
    pxSm: '2px 2px 0px rgba(0,0,0,0.70)',
    px:   '4px 4px 0px rgba(0,0,0,0.80)',
    pxLg: '6px 6px 0px rgba(0,0,0,0.80)',
    pxXl: '8px 8px 0px rgba(0,0,0,0.85)',
  },

  // ─── Règles d'usage ────────────────────────────────────────────────────────

  usage: {
    /** Logo PokéGames dans TopBar, code de session */
    h1:       'font-display tracking-wide',
    /** Titre de carte, header de panneau de jeu */
    h2:       'font-heading font-semibold tracking-wide',
    /** Titre de sous-section, label de groupe */
    h3:       'font-heading font-medium tracking-wide',
    /** Texte descriptif, paragraphe */
    body:     'font-body font-normal',
    /** Bouton, label de formulaire, badge */
    ui:       'font-body font-medium',
    /** Texte secondaire, aide, timestamp */
    muted:    'font-body font-normal text-sm',
  },

} as const;
