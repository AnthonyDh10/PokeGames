import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DescriptionCard from '../../app/components/pokedesc/DescriptionCard';

const descriptions = ['Première description', 'Deuxième description', 'Troisième description'];

describe('DescriptionCard — affichage', () => {
  it('affiche le titre DESCRIPTION', () => {
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByText('DESCRIPTION')).toBeInTheDocument();
  });

  it('affiche la description à l\'index donné', () => {
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={1}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByText('Deuxième description')).toBeInTheDocument();
  });

  it('affiche le message de chargement si descriptions est vide', () => {
    render(
      <DescriptionCard
        descriptions={[]}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByText('Chargement de la description...')).toBeInTheDocument();
  });

  it('affiche le bouton zoom 🔍', () => {
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByTitle('Agrandir la description')).toBeInTheDocument();
  });
});

describe('DescriptionCard — pagination', () => {
  it('affiche les boutons ◀ et ▶ si descriptions.length > 1', () => {
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByText('◀')).toBeInTheDocument();
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('n\'affiche pas les boutons de pagination si une seule description', () => {
    render(
      <DescriptionCard
        descriptions={['Une seule']}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.queryByText('◀')).not.toBeInTheDocument();
    expect(screen.queryByText('▶')).not.toBeInTheDocument();
  });

  it('affiche "index+1 / total" de pagination', () => {
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={1}
        onChangeIndex={vi.fn()}
        onZoom={vi.fn()}
      />
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('appelle onChangeIndex au clic sur ▶', () => {
    const onChangeIndex = vi.fn();
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={onChangeIndex}
        onZoom={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('▶'));
    expect(onChangeIndex).toHaveBeenCalledOnce();
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(0)).toBe(1);
  });

  it('appelle onChangeIndex au clic sur ◀', () => {
    const onChangeIndex = vi.fn();
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={1}
        onChangeIndex={onChangeIndex}
        onZoom={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('◀'));
    expect(onChangeIndex).toHaveBeenCalledOnce();
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(1)).toBe(0);
  });

  it('wrap en boucle ▶ depuis le dernier index', () => {
    const onChangeIndex = vi.fn();
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={2}
        onChangeIndex={onChangeIndex}
        onZoom={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('▶'));
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(2)).toBe(0);
  });

  it('wrap en boucle ◀ depuis index 0', () => {
    const onChangeIndex = vi.fn();
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={onChangeIndex}
        onZoom={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('◀'));
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(0)).toBe(2);
  });
});

describe('DescriptionCard — zoom', () => {
  it('appelle onZoom au clic sur le bouton zoom', () => {
    const onZoom = vi.fn();
    render(
      <DescriptionCard
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onZoom={onZoom}
      />
    );
    fireEvent.click(screen.getByTitle('Agrandir la description'));
    expect(onZoom).toHaveBeenCalledOnce();
  });
});
