/**
 * PokéGames — Typographie officielle
 * ====================================
 * Direction artistique : Bangers pour l'impact des titres (style BD/jeux vidéo),
 * Nunito pour la lisibilité du corps de texte (arrondi, moderne, friendly).
 *
 * Hiérarchie :
 *  - h1 / display  → Bangers            → titres principaux, logo, noms de jeux
 *  - h2 / heading  → Nunito ExtraBold   → titres de section, sous-titres importants
 *  - h3            → Nunito Bold        → sous-sections, labels de carte
 *  - body / p      → Nunito Regular     → descriptions, paragraphes
 *  - ui / small    → Nunito Medium      → boutons, labels, inputs, badges
 *
 * Classes Tailwind disponibles (définies dans theme.css) :
 *  font-display  → Bangers
 *  font-body     → Nunito (default sur <body>)
 *
 * Usage dans un composant :
 *  import { typography } from "../design/typography";
 *
 *  // Inline style (rare — préférer les classes Tailwind)
 *  <h1 style={{ fontFamily: typography.fonts.display }}>PokéGames</h1>
 *
 *  // Classe Tailwind (usage habituel)
 *  <h1 className="font-display text-4xl tracking-wide">PokéGames</h1>
 *  <p className="font-body text-base">Description du Pokémon...</p>
 */

export const typography = {

  // ─── Familles de polices ───────────────────────────────────────────────────

  fonts: {
    /** Bangers — titres principaux, logo, noms de mini-jeux */
    display: '"Bangers", cursive',
    /** Nunito — tout le reste : corps, boutons, labels, sous-titres */
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
  // Bangers bénéficie d'un tracking légèrement plus large.

  tracking: {
    display: '0.05em',  // Bangers — un peu d'air pour la lisibilité
    heading: '-0.01em', // Nunito Bold — légèrement condensé
    body:    '0em',     // Normal
    ui:      '0.01em',  // Boutons / labels — micro-aération
  },

  // ─── Règles d'usage ────────────────────────────────────────────────────────

  usage: {
    /** Titre de page, nom du jeu dans TopBar, titres GameCard */
    h1:       'font-display tracking-wide',
    /** Titre de section (SectionTitle), sous-titre important */
    h2:       'font-body font-extrabold tracking-tight',
    /** Titre de carte, label de groupe */
    h3:       'font-body font-bold',
    /** Texte descriptif, paragraphe */
    body:     'font-body font-normal',
    /** Bouton, label de formulaire, badge */
    ui:       'font-body font-medium',
    /** Texte secondaire, aide, timestamp */
    muted:    'font-body font-normal text-sm',
  },

} as const;
