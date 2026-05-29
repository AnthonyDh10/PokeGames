import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionTitle from '../../app/components/primitives/SectionTitle';
import Footer from '../../app/components/layout/Footer';

// ───────────────────────────────────────────────────────────────
// SectionTitle
// ───────────────────────────────────────────────────────────────
describe('SectionTitle', () => {
  it('affiche le texte children dans un h2', () => {
    render(<SectionTitle>Mes Mini-Jeux</SectionTitle>);
    const heading = screen.getByRole('heading', { level: 2, name: /mes mini-jeux/i });
    expect(heading).toBeInTheDocument();
  });

  it('accepte des children de type string', () => {
    render(<SectionTitle>Titre de section</SectionTitle>);
    expect(screen.getByText(/titre de section/i)).toBeInTheDocument();
  });

  it('applique className supplémentaire quand fournie', () => {
    const { container } = render(<SectionTitle className="mt-8">Test</SectionTitle>);
    const h2 = container.querySelector('h2');
    expect(h2?.className).toContain('mt-8');
  });

  it('inclut toujours les classes de base (font-heading, uppercase...)', () => {
    const { container } = render(<SectionTitle>Test</SectionTitle>);
    const h2 = container.querySelector('h2');
    expect(h2?.className).toContain('font-heading');
    expect(h2?.className).toContain('uppercase');
  });

  it('rend l\'indicateur coloré (span)', () => {
    const { container } = render(<SectionTitle>Test</SectionTitle>);
    // Un span avec des classes w-2, h-6
    const indicator = container.querySelector('span.w-2.h-6');
    expect(indicator).not.toBeNull();
  });

  it('fonctionne sans className (défaut vide)', () => {
    render(<SectionTitle>Pas de classe</SectionTitle>);
    expect(screen.getByText(/pas de classe/i)).toBeInTheDocument();
  });
});

// ───────────────────────────────────────────────────────────────
// Footer
// ───────────────────────────────────────────────────────────────
describe('Footer', () => {
  it('rend un élément <footer>', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('affiche le titre "Contact"', () => {
    render(<Footer />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('affiche le lien email du développeur', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /antho\.dh@icloud\.com/i });
    expect(link).toHaveAttribute('href', 'mailto:antho.dh@icloud.com');
  });

  it('affiche la mention Nintendo / Pokémon Company', () => {
    render(<Footer />);
    expect(screen.getByText(/Nintendo/)).toBeInTheDocument();
  });

  it('affiche la mention PokéAPI', () => {
    render(<Footer />);
    expect(screen.getByText(/PokéAPI/)).toBeInTheDocument();
  });

  it('affiche le nom du développeur', () => {
    render(<Footer />);
    expect(screen.getByText(/Anthony DINH/)).toBeInTheDocument();
  });
});
