import { colors } from "../design/colors";

interface PokeballProps {
  onClick?: () => void;
  className?: string;
}

interface PokeballDecorProps {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
}

export function PokeballDecor({ size = 90, opacity = 0.10, color = colors.brand.white, className = '' }: PokeballDecorProps) {
  // Résolution de la grille (Modifiable : 30, 40, 50...)
  const GRID_SIZE = 32; 
  const PIXEL_SIZE = 100 / GRID_SIZE; // On divise la viewBox(100) par le nombre de cellules

  const pixels = [];

  // Centre mathématique de la grille
  const cx = GRID_SIZE / 2;
  const cy = GRID_SIZE / 2;

  // Calculs dynamiques basés sur GRID_SIZE pour que le dessin ne déborde jamais
  const maxRadius = (GRID_SIZE / 2) - 1; // Le rayon max s'arrête 1 "pixel" avant le bord
  const strokeThickness = Math.max(1, GRID_SIZE * 0.05); // Épaisseur des traits relative
  const centerRadius = GRID_SIZE * 0.16; // Rayon du bouton central

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let isPixelFilled = false;

      // 1. Cercle extérieur (dynamique)
      if (distance <= maxRadius && distance >= maxRadius - strokeThickness * 1.2) {
        isPixelFilled = true;
      }
      // 2. Bouton central
      else if (distance <= centerRadius) {
        isPixelFilled = true;
      }
      // 3. Ligne horizontale centrale
      else if (Math.abs(dy) <= strokeThickness / 2 && distance < maxRadius) {
        isPixelFilled = true;
      }

      if (isPixelFilled) {
        pixels.push(
          <rect
            key={`${x}-${y}`}
            x={x * PIXEL_SIZE}
            y={y * PIXEL_SIZE}
            width={PIXEL_SIZE}
            height={PIXEL_SIZE}
            fill={color}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
      shapeRendering="crispEdges" // Force le rendu "escalier" brut (pixel art)
    >
      {pixels}
    </svg>
  );
}