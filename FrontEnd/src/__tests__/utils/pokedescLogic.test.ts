import { describe, it, expect } from 'vitest';
import { generationToNumber, isHintLocked, filterHintPokemons, filterSearchPokemons, formatGenerations, getGenerationsDisplay } from '../../app/utils/pokedescLogic';
import type { PokemonDto } from '../../app/types/pokemon';

// ─────────────────────────────────────────────
// generationToNumber
// ─────────────────────────────────────────────

describe('generationToNumber', () => {
  it('retourne 1 pour "generation-i"', () => {
    expect(generationToNumber('generation-i')).toBe(1);
  });

  it('retourne 9 pour "generation-ix"', () => {
    expect(generationToNumber('generation-ix')).toBe(9);
  });

  it('retourne 3 pour "generation-iii"', () => {
    expect(generationToNumber('generation-iii')).toBe(3);
  });

  it('retourne null pour une chaîne sans génération', () => {
    expect(generationToNumber('unknown')).toBeNull();
  });

  it('retourne null pour une chaîne vide', () => {
    expect(generationToNumber('')).toBeNull();
  });
});

// ─────────────────────────────────────────────
// isHintLocked
// ─────────────────────────────────────────────

describe('isHintLocked', () => {
  it('retourne false si l\'indice est déjà utilisé', () => {
    expect(isHintLocked('Type1', ['Type1'], 10, 60)).toBe(false);
  });

  it('retourne false si le timer est infini (-1)', () => {
    expect(isHintLocked('Sprite', [], 0, -1)).toBe(false);
  });

  it('retourne true si la pénalité dépasse le temps restant', () => {
    // Sprite = 50% de pénalité sur 60s = 30s. timeRemaining=5 < 30 → locked
    expect(isHintLocked('Sprite', [], 5, 60)).toBe(true);
  });

  it('retourne false si le temps restant est suffisant', () => {
    // Type1 = 20% de pénalité sur 60s = 12s. timeRemaining=30 > 12 → not locked
    expect(isHintLocked('Type1', [], 30, 60)).toBe(false);
  });

  it('retourne true si pénalité exactement égale au temps restant', () => {
    // Type1 = 20% de 60s = 12s. timeRemaining=12 → penaltySeconds(12) > timeRemaining(12) → false
    expect(isHintLocked('Type1', [], 12, 60)).toBe(false);
  });

  it('retourne true si penaltySeconds > timeRemaining', () => {
    // Type1 = 20% de 60s = 12s. timeRemaining=11 → 12 > 11 → true
    expect(isHintLocked('Type1', [], 11, 60)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// filterHintPokemons
// ─────────────────────────────────────────────

const makePokemon = (overrides: Partial<PokemonDto>): PokemonDto => ({
  id: '1',
  numericId: 1,
  nameFr: 'Bulbizarre',
  nameEn: 'Bulbasaur',
  pokedexNumber: 1,
  category: 'Pokémon Graine',
  generation: { nameFr: 'Génération I', nameEn: 'generation-i' },
  types: [{ name: 'Plante', nameEn: 'Grass', slot: 1 }],
  physical: { heightM: 0.7, weightKg: 6.9 },
  status: { isLegendary: false, isMythical: false, captureRate: 45 },
  sprites: { frontDefault: '', frontShiny: '', backDefault: null, backShiny: null },
  description: ['Bulbizarre peut être vu ...'],
  ...overrides,
});

describe('filterHintPokemons', () => {
  const bulbizarre = makePokemon({});
  const salamèche = makePokemon({
    id: '4',
    numericId: 4,
    nameFr: 'Salamèche',
    nameEn: 'Charmander',
    pokedexNumber: 4,
    types: [{ name: 'Feu', nameEn: 'Fire', slot: 1 }],
  });
  const mewtwo = makePokemon({
    id: '150',
    numericId: 150,
    nameFr: 'Mewtwo',
    nameEn: 'Mewtwo',
    pokedexNumber: 150,
    types: [{ name: 'Psy', nameEn: 'Psychic', slot: 1 }],
    status: { isLegendary: true, isMythical: false, captureRate: 3 },
  });

  it('retourne tous les pokémon si pas de filtres', () => {
    const result = filterHintPokemons([bulbizarre, salamèche, mewtwo], {}, []);
    expect(result).toHaveLength(3);
  });

  it('filtre par génération', () => {
    const mew2 = makePokemon({
      id: '150',
      numericId: 150,
      nameFr: 'Mewtwo',
      pokedexNumber: 150,
      generation: { nameFr: 'Génération I', nameEn: 'generation-i' },
    });
    const result = filterHintPokemons([bulbizarre, mew2], {}, [1]);
    expect(result).toHaveLength(2);
  });

  it('filtre par Type 1', () => {
    const result = filterHintPokemons(
      [bulbizarre, salamèche, mewtwo],
      { 'Type 1': 'Plante' },
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].nameFr).toBe('Bulbizarre');
  });

  it('filtre par Génération', () => {
    const gen2Pokemon = makePokemon({
      id: '152',
      numericId: 152,
      nameFr: 'Germignon',
      pokedexNumber: 152,
      generation: { nameFr: 'Génération II', nameEn: 'generation-ii' },
    });
    const result = filterHintPokemons(
      [bulbizarre, gen2Pokemon],
      { 'Génération': 'Génération II' },
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].nameFr).toBe('Germignon');
  });

  it('filtre "Pas de second type" pour Type 2', () => {
    const bulbWithType2 = makePokemon({
      types: [
        { name: 'Plante', nameEn: 'Grass', slot: 1 },
        { name: 'Poison', nameEn: 'Poison', slot: 2 },
      ],
    });
    const result = filterHintPokemons(
      [bulbWithType2, salamèche],
      { 'Type 2': 'Pas de second type' },
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].nameFr).toBe('Salamèche');
  });
});

// ─────────────────────────────────────────────
// filterSearchPokemons
// ─────────────────────────────────────────────

describe('filterSearchPokemons', () => {
  const pokemons = [
    makePokemon({ nameFr: 'Bulbizarre', pokedexNumber: 1 }),
    makePokemon({ id: '4', numericId: 4, nameFr: 'Salamèche', pokedexNumber: 4 }),
    makePokemon({ id: '7', numericId: 7, nameFr: 'Carapuce', pokedexNumber: 7 }),
  ];

  it('retourne [] pour une recherche vide', () => {
    expect(filterSearchPokemons(pokemons, '')).toHaveLength(0);
  });

  it('filtre par nom (insensible à la casse)', () => {
    const result = filterSearchPokemons(pokemons, 'bulb');
    expect(result).toHaveLength(1);
    expect(result[0].nameFr).toBe('Bulbizarre');
  });

  it('filtre par numéro de pokédex', () => {
    const result = filterSearchPokemons(pokemons, '4');
    expect(result.some((p) => p.pokedexNumber === 4)).toBe(true);
  });

  it('retourne [] quand aucun résultat', () => {
    expect(filterSearchPokemons(pokemons, 'pikachu')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// formatGenerations
// ─────────────────────────────────────────────

describe('formatGenerations', () => {
  it('retourne "" pour un tableau vide', () => {
    expect(formatGenerations([])).toBe('');
  });

  it('retourne "Toutes générations" pour les générations 1 à 8', () => {
    expect(formatGenerations([1, 2, 3, 4, 5, 6, 7, 8])).toBe('Toutes générations');
  });

  it('retourne "Générations 1" pour une seule génération', () => {
    expect(formatGenerations([1])).toBe('Générations 1');
  });

  it('retourne "Générations 1-3" pour des générations consécutives', () => {
    expect(formatGenerations([1, 2, 3])).toBe('Générations 1-3');
  });

  it('retourne les générations séparées par virgule si non consécutives', () => {
    expect(formatGenerations([1, 3, 5])).toBe('Générations 1,3,5');
  });

  it('utilise le préfixe court "Gén" si isShort=true', () => {
    expect(formatGenerations([2], true)).toBe('Gén 2');
  });

  it('trie les générations avant de les afficher', () => {
    expect(formatGenerations([3, 1, 2])).toBe('Générations 1-3');
  });
});

// ─────────────────────────────────────────────
// getGenerationsDisplay
// ─────────────────────────────────────────────

describe('getGenerationsDisplay', () => {
  it('retourne null pour un tableau vide', () => {
    expect(getGenerationsDisplay([])).toBeNull();
  });

  it('retourne null si undefined', () => {
    expect(getGenerationsDisplay(undefined)).toBeNull();
  });

  it('retourne "1 à 8" pour les 8 générations', () => {
    const result = getGenerationsDisplay([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result?.value).toBe('1 à 8');
    expect(result?.label).toContain('Générations sélectionnées');
  });

  it('retourne le numéro seul pour une génération unique', () => {
    const result = getGenerationsDisplay([3]);
    expect(result?.value).toBe('3');
    expect(result?.label).toContain('Génération sélectionnée');
  });

  it('retourne "1 à N" pour des générations consécutives depuis 1', () => {
    const result = getGenerationsDisplay([1, 2, 3, 4]);
    expect(result?.value).toBe('1 à 4');
  });

  it('retourne les numéros séparés par virgule si non consécutives depuis 1', () => {
    const result = getGenerationsDisplay([2, 4, 6]);
    expect(result?.value).toBe('2,4,6');
  });

  it('retourne les numéros séparés si consécutifs mais ne commencent pas à 1', () => {
    const result = getGenerationsDisplay([3, 4, 5]);
    expect(result?.value).toBe('3,4,5');
  });
});

// ─────────────────────────────────────────────
// filterHintPokemons — branche Type 2 spécifique
// ─────────────────────────────────────────────

describe('filterHintPokemons — Type 2 spécifique', () => {
  const makePokemonLocal = (overrides: Partial<PokemonDto>): PokemonDto => ({
    id: '1', numericId: 1, nameFr: 'Bulbizarre', nameEn: 'Bulbasaur', pokedexNumber: 1,
    category: 'Pokémon Graine', generation: { nameFr: 'Génération I', nameEn: 'generation-i' },
    types: [{ name: 'Plante', nameEn: 'Grass', slot: 1 }],
    physical: { heightM: 0.7, weightKg: 6.9 },
    status: { isLegendary: false, isMythical: false, captureRate: 45 },
    sprites: { frontDefault: '', frontShiny: '', backDefault: null, backShiny: null },
    description: [],
    ...overrides,
  });

  it('filtre par un Type 2 précis', () => {
    const bulbWithPoison = makePokemonLocal({
      types: [{ name: 'Plante', nameEn: 'Grass', slot: 1 }, { name: 'Poison', nameEn: 'Poison', slot: 2 }],
    });
    const bulbWithFly = makePokemonLocal({
      id: '2', nameFr: 'Herbizarre', pokedexNumber: 2,
      types: [{ name: 'Plante', nameEn: 'Grass', slot: 1 }, { name: 'Vol', nameEn: 'Flying', slot: 2 }],
    });
    const result = filterHintPokemons([bulbWithPoison, bulbWithFly], { 'Type 2': 'Poison' }, []);
    expect(result).toHaveLength(1);
    expect(result[0].nameFr).toBe('Bulbizarre');
  });

  it('filtre par Type 2 excluant ceux sans second type', () => {
    const monoType = makePokemonLocal({ types: [{ name: 'Feu', nameEn: 'Fire', slot: 1 }] });
    const result = filterHintPokemons([monoType], { 'Type 2': 'Poison' }, []);
    expect(result).toHaveLength(0);
  });
});
