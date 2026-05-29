import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WinnerCard from '../../app/components/game/WinnerCard';

describe('WinnerCard — mode solo', () => {
  it('affiche "VICTOIRE !" en mode solo', () => {
    render(<WinnerCard isSolo={true} bothFinished={true} />);
    expect(screen.getByText('VICTOIRE !')).toBeInTheDocument();
  });

  it('n\'affiche pas le nom du gagnant en mode solo', () => {
    render(<WinnerCard isSolo={true} bothFinished={true} winner="Ash" />);
    // En solo, winner n'est pas affiché (condition : !isSolo)
    expect(screen.queryByText('Ash')).not.toBeInTheDocument();
  });
});

describe('WinnerCard — mode multijoueur en attente', () => {
  it('affiche le message d\'attente si bothFinished=false', () => {
    render(<WinnerCard isSolo={false} bothFinished={false} />);
    expect(screen.getByText("EN ATTENTE QUE L'AUTRE JOUEUR FINISSE...")).toBeInTheDocument();
  });

  it('n\'affiche pas le nom du gagnant si bothFinished=false', () => {
    render(<WinnerCard isSolo={false} bothFinished={false} winner="Ash" />);
    expect(screen.queryByText('Ash')).not.toBeInTheDocument();
  });
});

describe('WinnerCard — mode multijoueur terminé', () => {
  it('affiche "VAINQUEUR" si bothFinished=true et winner défini', () => {
    render(<WinnerCard isSolo={false} bothFinished={true} winner="Ash" />);
    expect(screen.getByText('VAINQUEUR')).toBeInTheDocument();
  });

  it('affiche le nom du gagnant si bothFinished=true et winner défini', () => {
    render(<WinnerCard isSolo={false} bothFinished={true} winner="Ash" />);
    expect(screen.getByText('Ash')).toBeInTheDocument();
  });

  it('affiche "MATCH NUL" si bothFinished=true et winner est null', () => {
    render(<WinnerCard isSolo={false} bothFinished={true} winner={null} />);
    expect(screen.getByText('MATCH NUL')).toBeInTheDocument();
  });

  it('affiche "MATCH NUL" si bothFinished=true et winner est undefined', () => {
    render(<WinnerCard isSolo={false} bothFinished={true} />);
    expect(screen.getByText('MATCH NUL')).toBeInTheDocument();
  });

  it('n\'affiche pas le div du gagnant si match nul', () => {
    render(<WinnerCard isSolo={false} bothFinished={true} winner={null} />);
    // Le div du nom gagnant n'est rendu que si winner && !isSolo && bothFinished
    expect(screen.queryByRole('heading', { level: 2 })?.textContent).toBe('MATCH NUL');
  });
});

describe('WinnerCard — priorité des conditions', () => {
  it('priorité solo > bothFinished=false (affiche VICTOIRE)', () => {
    // Si isSolo=true, bothFinished=false → solo gagne
    render(<WinnerCard isSolo={true} bothFinished={false} />);
    expect(screen.getByText('VICTOIRE !')).toBeInTheDocument();
    expect(screen.queryByText("EN ATTENTE QUE L'AUTRE JOUEUR FINISSE...")).not.toBeInTheDocument();
  });
});
