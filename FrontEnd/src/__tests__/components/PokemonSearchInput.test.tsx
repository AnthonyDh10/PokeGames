import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PokemonSearchInput, { normalizeString, SearchableItem } from '../../app/components/PokemonSearchInput';

describe('normalizeString', () => {
  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(normalizeString('')).toBe('');
  });

  it('convertit en minuscules', () => {
    expect(normalizeString('BULBIZARRE')).toBe('bulbizarre');
  });

  it('supprime les accents (é → e)', () => {
    expect(normalizeString('été')).toBe('ete');
  });

  it('supprime les accents (à → a)', () => {
    expect(normalizeString('château')).toBe('chateau');
  });

  it('combine minuscules et suppression d\'accents', () => {
    expect(normalizeString('CHÂTEAU')).toBe('chateau');
  });
});

describe('PokemonSearchInput', () => {
  const mockItems: SearchableItem[] = [
    { id: 1, nameFr: 'Bulbizarre', pokedexNumber: 1 },
    { id: 4, nameFr: 'Salamèche', pokedexNumber: 4 },
    { id: 7, nameFr: 'Carapuce', pokedexNumber: 7 },
  ];

  const mockOnChange = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le placeholder par défaut', () => {
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByPlaceholderText('Rechercher...');
    expect(input).toBeInTheDocument();
  });

  it('affiche un placeholder personnalisé', () => {
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
        placeholder="Chercher un Pokémon..."
      />
    );

    expect(screen.getByPlaceholderText('Chercher un Pokémon...')).toBeInTheDocument();
  });

  it('appelle onChange quand l\'utilisateur tape', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'Bulb');

    // onChange est appelé 4 fois pour chaque caractère
    expect(mockOnChange).toHaveBeenCalledTimes(4);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'B');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'u');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'l');
    expect(mockOnChange).toHaveBeenNthCalledWith(4, 'b');
  });

  it('ouvre la dropdown au focus', async () => {
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('ferme la dropdown au clic en dehors', async () => {
    render(
      <div>
        <PokemonSearchInput
          items={mockItems}
          value="test"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
        />
        <div data-testid="outside">Clic en dehors</div>
      </div>
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('affiche la dropdown quand value est rempli et items est vide mais value n\'est pas vide', () => {
    render(
      <PokemonSearchInput
        items={[]}
        value="xyz"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // shouldShowDropdown = showDropdown && (items.length > 0 || value.trim() !== '')
    // La dropdown s'affiche si value n'est pas vide
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('ne rend pas la dropdown visuellement si items est vide et value est vide', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={[]}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // aria-expanded est true, mais le listbox n'existe pas dans le DOM
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigue avec les flèches clavier (ArrowDown)', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    
    // Focus sur l'input pour que les événements clavier fonctionnent
    await user.click(input);
    
    // Dropdown s'ouvre après click (via onFocus)
    expect(input).toHaveAttribute('aria-expanded', 'true');
    
    // ArrowDown pour naviguer vers l'index 1
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-1');
    
    // ArrowDown pour naviguer vers l'index 2
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-2');
  });

  it('navigue avec les flèches clavier (ArrowUp)', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    
    // Ouvrir et naviguer à l'index 2
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-2');

    // ArrowUp pour revenir à l'index 1
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-1');
  });

  it('remonte à 0 quand ArrowUp au premier index', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // activeIndex reste à 0, ArrowUp ne fait rien
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-0');
  });

  it('descend jusqu\'au dernier item avec ArrowDown', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Descendre jusqu'à l'index 2 (3 items)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-2');

    // ArrowDown ne fait rien au dernier
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-2');
  });

  it('sélectionne l\'item avec Enter', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
  });

  it('ne fait rien avec Enter si la dropdown est fermée', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    // Pas de click/focus, dropdown reste fermée
    await user.keyboard('{Enter}');

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('ferme la dropdown avec Escape', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('sélectionne l\'item avec un clic souris', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Chercher l'item dans le listbox
    const listbox = screen.getByRole('listbox');
    const options = listbox.querySelectorAll('[role="option"]');
    
    await user.click(options[0]);

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('ferme la dropdown après sélection', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const listbox = screen.getByRole('listbox');
    const options = listbox.querySelectorAll('[role="option"]');
    
    await user.click(options[0]);

    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('change aria-activedescendant au survol souris', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const listbox = screen.getByRole('listbox');
    const options = listbox.querySelectorAll('[role="option"]');

    fireEvent.mouseMove(listbox);
    fireEvent.mouseEnter(options[1]);

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-1');
    });
  });

  it('affiche le numéro de Pokédex quand pokedexNumber est fourni', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
  });

  it('affiche le nom sans le numéro', async () => {
    const user = userEvent.setup();
    const itemsWithoutPokedex: SearchableItem[] = [
      { id: 1, nameFr: 'Bulbizarre' },
      { id: 4, nameFr: 'Salamèche' },
    ];
    
    render(
      <PokemonSearchInput
        items={itemsWithoutPokedex}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    expect(screen.getByText('Bulbizarre')).toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });

  it('désactive le champ quand disabled=true', () => {
    render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
        disabled={true}
      />
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('réinitialise activeIndex quand value change', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PokemonSearchInput
        items={mockItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}');

    // activeIndex = 2
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-2');

    // Changer value
    rerender(
      <PokemonSearchInput
        items={mockItems}
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    // activeIndex doit être réinitialisé à 0
    expect(input).toHaveAttribute('aria-activedescendant', 'pokemon-option-0');
  });

  it('gère les items vides gracieusement', async () => {
    const user = userEvent.setup();
    render(
      <PokemonSearchInput
        items={[]}
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('gère les items avec des id numériques et string', async () => {
    const user = userEvent.setup();
    const mixedIdItems: SearchableItem[] = [
      { id: 1, nameFr: 'Item 1' },
      { id: 'custom-id', nameFr: 'Item 2' },
    ];

    render(
      <PokemonSearchInput
        items={mixedIdItems}
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const listbox = screen.getByRole('listbox');
    const options = listbox.querySelectorAll('[role="option"]');

    // Vérifier que les deux items sont rendus
    expect(options.length).toBe(2);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
