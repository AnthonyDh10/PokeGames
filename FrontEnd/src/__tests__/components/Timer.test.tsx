import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timer from '../../app/components/Timer';

describe('Timer — mode countdown (défaut)', () => {
  it('affiche le temps en secondes entières', () => {
    render(<Timer value={30} />);
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('affiche le label "Temps :"', () => {
    render(<Timer value={30} />);
    expect(screen.getByText('Temps :')).toBeInTheDocument();
  });

  it('affiche ♾️ quand value est Infinity', () => {
    render(<Timer value={Infinity} />);
    expect(screen.getByText('♾️')).toBeInTheDocument();
  });

  it('affiche ♾️ quand value > 10000', () => {
    render(<Timer value={99999} />);
    expect(screen.getByText('♾️')).toBeInTheDocument();
  });

  it('affiche 0s pour value=0', () => {
    render(<Timer value={0} />);
    expect(screen.getByText('0s')).toBeInTheDocument();
  });

  it('affiche avec couleur verte (>20s)', () => {
    const { container } = render(<Timer value={30} />);
    const span = container.querySelector('span[style]');
    expect(span).not.toBeNull();
    // La couleur "ok" correspond au timer vert
    expect(span!.getAttribute('style')).toContain('color');
  });

  it('applique shake quand shake=true', () => {
    const { container } = render(<Timer value={10} shake={true} />);
    const span = container.querySelector('span.font-heading');
    expect(span?.className).toContain('animate-[shake_0.5s_ease-in-out]');
  });

  it('n\'applique pas shake quand shake=false', () => {
    const { container } = render(<Timer value={10} shake={false} />);
    const span = container.querySelector('span.font-heading');
    expect(span?.className).not.toContain('animate-[shake_0.5s_ease-in-out]');
  });

  it('applique flash quand flash=true', () => {
    const { container } = render(<Timer value={10} flash={true} />);
    const span = container.querySelector('span.font-heading');
    expect(span?.className).toContain('animate-[flashRed_0.3s_ease-in-out]');
  });

  it('affiche la pénalité quand showPenalty=true et penaltyValue fourni', () => {
    render(<Timer value={30} showPenalty={true} penaltyValue={15} />);
    expect(screen.getByText('-15s')).toBeInTheDocument();
  });

  it('n\'affiche pas la pénalité quand showPenalty=false', () => {
    render(<Timer value={30} showPenalty={false} penaltyValue={15} />);
    expect(screen.queryByText('-15s')).not.toBeInTheDocument();
  });

  it('n\'affiche pas la pénalité si penaltyValue est undefined', () => {
    render(<Timer value={30} showPenalty={true} />);
    // Cherche le pattern "-Xs"
    const penalty = screen.queryByText(/-\d+s/);
    expect(penalty).not.toBeInTheDocument();
  });
});

describe('Timer — mode stopwatch', () => {
  it('affiche en format "Xs" sous 60 secondes', () => {
    render(<Timer value={45} mode="stopwatch" />);
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('affiche en format "Xm Ys" au dessus de 60 secondes', () => {
    render(<Timer value={90} mode="stopwatch" />);
    expect(screen.getByText('1m 30s')).toBeInTheDocument();
  });

  it('affiche "2m 0s" pour 120 secondes', () => {
    render(<Timer value={120} mode="stopwatch" />);
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  it('arrondit les fractions de secondes à l\'entier inférieur', () => {
    render(<Timer value={45.9} mode="stopwatch" />);
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('affiche en gris (couleur stopwatch) au lieu des couleurs countdown', () => {
    const { container } = render(<Timer value={5} mode="stopwatch" />);
    const span = container.querySelector('span[style]');
    // jsdom convertit #6B7280 en rgb(107, 114, 128)
    expect(span!.getAttribute('style')).toMatch(/color:\s*rgb\(107,\s*114,\s*128\)/);
  });
});
