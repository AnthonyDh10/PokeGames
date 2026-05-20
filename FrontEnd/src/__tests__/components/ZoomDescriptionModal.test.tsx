import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ZoomDescriptionModal from '../../app/components/modals/ZoomDescriptionModal';

const descriptions = ['Description A', 'Description B', 'Description C'];

describe('ZoomDescriptionModal', () => {
  it('ne rend rien si show=false', () => {
    const { container } = render(
      <ZoomDescriptionModal
        show={false}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche la description courante si show=true', () => {
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={1}
        onChangeIndex={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Description B')).toBeInTheDocument();
  });

  it('affiche le bouton fermer ×', () => {
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTitle('Fermer')).toBeInTheDocument();
  });

  it('appelle onClose quand on clique sur ×', () => {
    const onClose = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTitle('Fermer'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('appelle onClose quand on clique sur le backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={onClose}
      />
    );
    // Clic sur le backdrop (premier div fixé)
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ne ferme pas la modal quand on clique à l\'intérieur du contenu', () => {
    const onClose = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={onClose}
      />
    );
    // Clic sur le texte de description (stopPropagation)
    fireEvent.click(screen.getByText('Description A'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('affiche la pagination si descriptions.length > 1', () => {
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('◀')).toBeInTheDocument();
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('n\'affiche pas la pagination si descriptions.length = 1', () => {
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={['Seule description']}
        descriptionIndex={0}
        onChangeIndex={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('◀')).not.toBeInTheDocument();
    expect(screen.queryByText('▶')).not.toBeInTheDocument();
  });

  it('appelle onChangeIndex avec la bonne fonction au clic ▶', () => {
    const onChangeIndex = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={onChangeIndex}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('▶'));
    expect(onChangeIndex).toHaveBeenCalledOnce();
    // Le setter doit retourner 1 quand on est à l'index 0
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(0)).toBe(1);
  });

  it('appelle onChangeIndex avec la bonne fonction au clic ◀', () => {
    const onChangeIndex = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={1}
        onChangeIndex={onChangeIndex}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('◀'));
    expect(onChangeIndex).toHaveBeenCalledOnce();
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(1)).toBe(0);
  });

  it('wrap en boucle ◀ depuis index 0', () => {
    const onChangeIndex = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={0}
        onChangeIndex={onChangeIndex}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('◀'));
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(0)).toBe(2); // wrap vers dernier index
  });

  it('wrap en boucle ▶ depuis le dernier index', () => {
    const onChangeIndex = vi.fn();
    render(
      <ZoomDescriptionModal
        show={true}
        descriptions={descriptions}
        descriptionIndex={2}
        onChangeIndex={onChangeIndex}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('▶'));
    const setter = onChangeIndex.mock.calls[0][0];
    expect(setter(2)).toBe(0); // wrap vers premier index
  });
});
