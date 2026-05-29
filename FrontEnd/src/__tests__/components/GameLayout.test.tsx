import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameLayout from '../../app/components/game/GameLayout';

describe('GameLayout — état de chargement', () => {
  it('affiche "Chargement..." si isLoading=true', () => {
    render(
      <GameLayout
        isLoading={true}
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('n\'affiche pas le contenu principal si isLoading=true', () => {
    render(
      <GameLayout
        isLoading={true}
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.queryByText('Gauche')).not.toBeInTheDocument();
    expect(screen.queryByText('Droite')).not.toBeInTheDocument();
  });
});

describe('GameLayout — état d\'erreur', () => {
  it('affiche le message d\'erreur si error est défini', () => {
    render(
      <GameLayout
        error="Partie introuvable"
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByText(/Erreur : Partie introuvable/)).toBeInTheDocument();
  });

  it('affiche l\'icône ❌ en cas d\'erreur', () => {
    render(
      <GameLayout
        error="Une erreur"
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('affiche le bouton de retour si onErrorBack est fourni', () => {
    render(
      <GameLayout
        error="Erreur"
        onErrorBack={vi.fn()}
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();
  });

  it('n\'affiche pas de bouton de retour si onErrorBack est absent', () => {
    render(
      <GameLayout
        error="Erreur"
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('utilise errorBackLabel comme libellé du bouton', () => {
    render(
      <GameLayout
        error="Erreur"
        onErrorBack={vi.fn()}
        errorBackLabel="Accueil"
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeInTheDocument();
  });

  it('appelle onErrorBack au clic sur le bouton retour', () => {
    const onErrorBack = vi.fn();
    render(
      <GameLayout
        error="Erreur"
        onErrorBack={onErrorBack}
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onErrorBack).toHaveBeenCalledOnce();
  });

  it('n\'affiche pas le contenu principal si error est défini', () => {
    render(
      <GameLayout
        error="Erreur"
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.queryByText('Gauche')).not.toBeInTheDocument();
  });
});

describe('GameLayout — rendu normal', () => {
  it('affiche le contenu left et right', () => {
    render(
      <GameLayout
        left={<div>Colonne gauche</div>}
        right={<div>Colonne droite</div>}
      />
    );
    expect(screen.getByText('Colonne gauche')).toBeInTheDocument();
    expect(screen.getByText('Colonne droite')).toBeInTheDocument();
  });

  it('affiche le header s\'il est fourni', () => {
    render(
      <GameLayout
        header={<div>Mon Header</div>}
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    expect(screen.getByText('Mon Header')).toBeInTheDocument();
  });

  it('n\'affiche pas de header si non fourni', () => {
    const { container } = render(
      <GameLayout
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
      />
    );
    // Pas de div.mb-4 wrappant le header
    expect(container.querySelector('.mb-4')).toBeNull();
  });

  it('affiche les modales si fournies', () => {
    render(
      <GameLayout
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
        modals={<div>Ma Modale</div>}
      />
    );
    expect(screen.getByText('Ma Modale')).toBeInTheDocument();
  });

  it('utilise grid md:grid-cols-2 pour columns="1+1" (défaut)', () => {
    const { container } = render(
      <GameLayout
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
        columns="1+1"
      />
    );
    expect(container.querySelector('.md\\:grid-cols-2')).not.toBeNull();
  });

  it('utilise grid md:grid-cols-3 pour columns="1+2"', () => {
    const { container } = render(
      <GameLayout
        left={<div>Gauche</div>}
        right={<div>Droite</div>}
        columns="1+2"
      />
    );
    expect(container.querySelector('.md\\:grid-cols-3')).not.toBeNull();
  });
});
