import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FailureModal from '../../app/components/modals/FailureModal';
import SuccessModal from '../../app/components/modals/SuccessModal';

// ───────────────────────────────────────────────────────────────
// FailureModal
// ───────────────────────────────────────────────────────────────
describe('FailureModal', () => {
  const baseProps = {
    show: true,
    sprite: 'https://example.com/bulbasaur.png',
    pokemonName: 'Bulbizarre',
    isFinalPokemon: false,
    isTimeout: false,
    onProceed: vi.fn(),
  };

  it('ne rend rien si show=false', () => {
    const { container } = render(<FailureModal {...baseProps} show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ne rend rien si sprite est vide', () => {
    const { container } = render(<FailureModal {...baseProps} sprite="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche "Dommage !" si isTimeout=false', () => {
    render(<FailureModal {...baseProps} isTimeout={false} />);
    expect(screen.getByText('Dommage !')).toBeInTheDocument();
  });

  it('affiche "Temps écoulé !" si isTimeout=true', () => {
    render(<FailureModal {...baseProps} isTimeout={true} />);
    expect(screen.getByText('Temps écoulé !')).toBeInTheDocument();
  });

  it('affiche le nom du Pokémon', () => {
    render(<FailureModal {...baseProps} />);
    expect(screen.getByText('Bulbizarre')).toBeInTheDocument();
  });

  it('affiche le sprite du Pokémon', () => {
    render(<FailureModal {...baseProps} />);
    const img = screen.getByAltText('Pokémon à deviner');
    expect(img).toHaveAttribute('src', 'https://example.com/bulbasaur.png');
  });

  it('affiche "Pokémon suivant" si isFinalPokemon=false', () => {
    render(<FailureModal {...baseProps} isFinalPokemon={false} />);
    expect(screen.getByText('Pokémon suivant')).toBeInTheDocument();
  });

  it('affiche "Terminer la partie" si isFinalPokemon=true', () => {
    render(<FailureModal {...baseProps} isFinalPokemon={true} />);
    expect(screen.getByText('Terminer la partie')).toBeInTheDocument();
  });

  it('appelle onProceed au clic sur le bouton', () => {
    const onProceed = vi.fn();
    render(<FailureModal {...baseProps} onProceed={onProceed} />);
    fireEvent.click(screen.getByText('Pokémon suivant'));
    expect(onProceed).toHaveBeenCalledOnce();
  });
});

// ───────────────────────────────────────────────────────────────
// SuccessModal
// ───────────────────────────────────────────────────────────────
describe('SuccessModal', () => {
  const baseProps = {
    show: true,
    sprite: 'https://example.com/pikachu.png',
    pokemonName: 'Pikachu',
    isFinalPokemon: false,
    onProceed: vi.fn(),
  };

  it('ne rend rien si show=false', () => {
    const { container } = render(<SuccessModal {...baseProps} show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ne rend rien si sprite est vide', () => {
    const { container } = render(<SuccessModal {...baseProps} sprite="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche "Bravo !" dans le header', () => {
    render(<SuccessModal {...baseProps} />);
    expect(screen.getByText('Bravo !')).toBeInTheDocument();
  });

  it('affiche le nom du Pokémon', () => {
    render(<SuccessModal {...baseProps} />);
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
  });

  it('affiche le sprite du Pokémon', () => {
    render(<SuccessModal {...baseProps} />);
    const img = screen.getByAltText('Pokémon trouvé');
    expect(img).toHaveAttribute('src', 'https://example.com/pikachu.png');
  });

  it('affiche "Pokémon suivant" si isFinalPokemon=false', () => {
    render(<SuccessModal {...baseProps} isFinalPokemon={false} />);
    expect(screen.getByText('Pokémon suivant')).toBeInTheDocument();
  });

  it('affiche "Terminer la partie" si isFinalPokemon=true', () => {
    render(<SuccessModal {...baseProps} isFinalPokemon={true} />);
    expect(screen.getByText('Terminer la partie')).toBeInTheDocument();
  });

  it('appelle onProceed au clic sur le bouton', () => {
    const onProceed = vi.fn();
    render(<SuccessModal {...baseProps} onProceed={onProceed} />);
    fireEvent.click(screen.getByText('Pokémon suivant'));
    expect(onProceed).toHaveBeenCalledOnce();
  });
});
