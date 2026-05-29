import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PixelButton, { pixelClipPathLg, pixelClipPathSm } from '../../app/components/primitives/PixelButton';

const defaultColors = {
  colorBorder: '#000044',
  colorLight:  '#aabbff',
  colorDark:   '#000088',
  color:       '#0000ff',
};

describe('PixelButton — exports', () => {
  it('exporte pixelClipPathLg (string)', () => {
    expect(typeof pixelClipPathLg).toBe('string');
    expect(pixelClipPathLg).toContain('polygon');
  });

  it('exporte pixelClipPathSm (string)', () => {
    expect(typeof pixelClipPathSm).toBe('string');
    expect(pixelClipPathSm).toContain('polygon');
  });
});

describe('PixelButton — rendu de base', () => {
  it('rend un bouton', () => {
    render(<PixelButton {...defaultColors}>Cliquer</PixelButton>);
    expect(screen.getByRole('button', { name: 'Cliquer' })).toBeInTheDocument();
  });

  it('affiche le texte children', () => {
    render(<PixelButton {...defaultColors}>Mon Bouton</PixelButton>);
    expect(screen.getByText('Mon Bouton')).toBeInTheDocument();
  });

  it('type est "button" par défaut', () => {
    render(<PixelButton {...defaultColors}>Test</PixelButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepte type="submit"', () => {
    render(<PixelButton {...defaultColors} type="submit">Submit</PixelButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('n\'est pas désactivé par défaut', () => {
    render(<PixelButton {...defaultColors}>Test</PixelButton>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('est désactivé si disabled=true', () => {
    render(<PixelButton {...defaultColors} disabled={true}>Test</PixelButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('PixelButton — interactions', () => {
  it('appelle onClick au clic', () => {
    const onClick = vi.fn();
    render(<PixelButton {...defaultColors} onClick={onClick}>Cliquer</PixelButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('n\'appelle pas onClick si disabled', () => {
    const onClick = vi.fn();
    render(<PixelButton {...defaultColors} disabled={true} onClick={onClick}>Cliquer</PixelButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('affiche le title si fourni', () => {
    render(<PixelButton {...defaultColors} title="Indice 1">Hint</PixelButton>);
    expect(screen.getByTitle('Indice 1')).toBeInTheDocument();
  });
});

describe('PixelButton — styles', () => {
  it('applique className supplémentaire au bouton racine', () => {
    const { container } = render(
      <PixelButton {...defaultColors} className="w-full font-bold">Test</PixelButton>
    );
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('w-full');
    expect(btn?.className).toContain('font-bold');
  });

  it('applique les couleurs via style (background-color)', () => {
    const { container } = render(
      <PixelButton {...defaultColors}>Test</PixelButton>
    );
    const btn = container.querySelector('button');
    // jsdom convertit les hex en rgb — on vérifie que background-color est présent
    expect(btn?.getAttribute('style')).toContain('background-color');
  });

  it('utilise pixelClipPathLg par défaut dans le style', () => {
    const { container } = render(
      <PixelButton {...defaultColors}>Test</PixelButton>
    );
    const btn = container.querySelector('button');
    // clip-path est appliqué via le style
    expect(btn?.getAttribute('style')).toContain('clip-path');
  });

  it('utilise un clipPath personnalisé si fourni', () => {
    const { container } = render(
      <PixelButton {...defaultColors} clipPath={pixelClipPathSm}>Test</PixelButton>
    );
    const btn = container.querySelector('button');
    expect(btn?.getAttribute('style')).toContain('3px');
  });
});
