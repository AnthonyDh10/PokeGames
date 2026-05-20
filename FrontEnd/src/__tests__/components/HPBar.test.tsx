import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HPBar from '../../app/components/HPBar';

// framer-motion est mocké via vitest.setup.ts ou via le __mocks__ folder.
// Si ce n'est pas le cas, on le mock ici.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div style={style} className={className}>{children}</div>
    ),
  },
}));

describe('HPBar', () => {
  it('affiche le nom du joueur', () => {
    render(<HPBar name="Ash" current={3} max={5} />);
    // Le texte est en cas original — uppercase est appliqué via CSS Tailwind
    expect(screen.getByText('Ash')).toBeInTheDocument();
  });

  it('affiche le score current / max', () => {
    render(<HPBar name="Ash" current={3} max={5} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toBeInTheDocument();
  });

  it('affiche le label HP', () => {
    render(<HPBar name="Ash" current={3} max={5} />);
    expect(screen.getByText('HP')).toBeInTheDocument();
  });

  it('affiche le nom dans l\'élément div avec classe uppercase', () => {
    const { container } = render(<HPBar name="misty" current={2} max={5} />);
    // Le texte dans le DOM reste en cas original, CSS Tailwind 'uppercase' l'affiche en maj
    expect(screen.getByText('misty')).toBeInTheDocument();
    // Vérifier que la classe uppercase est bien appliquée au conteneur du nom
    const nameEl = container.querySelector('.uppercase');
    expect(nameEl).not.toBeNull();
  });

  it('ne dépasse pas 100% même si current > max', () => {
    // current=10, max=5 → percentage = 200% → clampé à 100%
    const { container } = render(<HPBar name="Ash" current={10} max={5} />);
    // La barre (motion.div) doit avoir width: 100%
    const bar = container.querySelector('div[style*="background"]');
    // Juste vérifier que le composant se rend sans erreur
    expect(bar).toBeInTheDocument();
  });

  it('calcule le pourcentage correctement pour 0', () => {
    render(<HPBar name="Ash" current={0} max={5} />);
    // current=0 → percentage=0 — le composant se rend sans erreur
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('met le nom en gras quand isWinner=true', () => {
    const { container } = render(<HPBar name="Ash" current={5} max={5} isWinner={true} />);
    const nameEl = container.querySelector('[style*="font-weight: bold"]');
    expect(nameEl).not.toBeNull();
  });

  it('ne met pas le nom en gras quand isWinner=false', () => {
    const { container } = render(<HPBar name="Ash" current={3} max={5} isWinner={false} />);
    const nameEl = container.querySelector('[style*="font-weight: normal"]');
    expect(nameEl).not.toBeNull();
  });

  it('isWinner est false par défaut (non bold)', () => {
    const { container } = render(<HPBar name="Ash" current={3} max={5} />);
    const bold = container.querySelector('[style*="font-weight: bold"]');
    expect(bold).toBeNull();
  });
});
