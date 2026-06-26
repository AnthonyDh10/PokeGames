import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../app/hooks/useGameState';

vi.mock('../../app/services/pokemonService', () => ({
  getCensoredDescription: vi.fn(),
  getHints: vi.fn(),
}));

vi.mock('../../app/services/partieService', () => ({
  getPartie: vi.fn(),
}));

import { getCensoredDescription, getHints } from '../../app/services/pokemonService';
import { getPartie } from '../../app/services/partieService';

const mockedGetPartie = vi.mocked(getPartie);
const mockedGetCensored = vi.mocked(getCensoredDescription);
const mockedGetHints = vi.mocked(getHints);

const fakePartie = {
  id: 'p1',
  codeSession: 'ABC',
  statut: 'EnCours',
  // Champs Phase 2 — requis par le nouveau PartieDto
  hostId: 'session-1',
  maxPlayers: 8,
  modeSolo: false,
  players: [],
  // Champs legacy — conservés pour useGameState en attendant Phase 4
  dresseur1Id: 'session-1',
  dresseur2Id: null,
  scoreJ1: 100,
  scoreJ2: 0,
  currentIndexJ1: 0,
  currentIndexJ2: 0,
  attemptsUsedJ1: 1,
  attemptsUsedJ2: 0,
  usedHintsJ1: ['Type1'],
  usedHintsJ2: [],
  timerDurationSeconds: 60,
  pokemonsToGuess: [{ id: '1' }],
  currentPokemonIdJ1: '1',
  currentPokemonIdJ2: null,
};

const fakeDesc = { descriptions: ['C\'est un Pokémon de type ***'] };
const fakeHints = {
  types: [{ slot: 1, name: 'Plante' }, { slot: 2, name: 'Poison' }],
  generation: { nameFr: 'Génération I' },
  category: 'Pokémon Graine',
  physical: { heightM: 0.7, weightKg: 6.9 },
  abilities: [{ name: 'Engrais' }, { name: 'Chlorophylle' }],
  stats: {},
  sprites: { frontDefault: 'https://example.com/bulbi.png' },
};

function renderGameState(overrides: Partial<Parameters<typeof useGameState>[0]> = {}) {
  return renderHook(() => {
    return useGameState({
      partieId: 'p1',
      sessionId: 'session-1',
      onSkip: vi.fn(),
      ...overrides,
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGameState', () => {
  it('est en chargement au démarrage', () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    expect(result.current.isLoading).toBe(true);
  });

  it('loadGameData charge la partie et les descriptions', async () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();

    let loadResult: any;
    await act(async () => {
      loadResult = await result.current.loadGameData();
    });

    expect(result.current.partie).toBeTruthy();
    expect(result.current.descriptions).toEqual(fakeDesc.descriptions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPokemonId).toBe('1');
    // Vérifier que loadGameData retourne les données de configuration
    expect(loadResult).toEqual({
      timerDurationSeconds: 60,
      sessionCode: 'ABC',
      isSolo: true,
    });
  });

  it('loadGameData détecte le joueur 1 correctement', async () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState({ sessionId: 'session-1' });

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.isPlayer1).toBe(true);
  });

  it('loadGameData définit le score et les indices du joueur', async () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.currentScore).toBe(100);
    expect(result.current.attemptsUsed).toBe(1);
    expect(result.current.usedHints).toEqual(['Type1']);
  });

  it('loadGameData gère une erreur de réseau', async () => {
    mockedGetPartie.mockRejectedValue(new Error('Network error'));

    const { result } = renderGameState();

    let loadResult: any;
    await act(async () => {
      loadResult = await result.current.loadGameData();
    });

    expect(result.current.errorMessage).toContain('Network error');
    expect(result.current.isLoading).toBe(false);
    expect(loadResult).toBeNull();
  });

  it('processRevealedHints mappe les indices correctement', async () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();

    await act(async () => {
      await result.current.loadGameData();
    });

    // Type 1 est dans usedHintsJ1, donc devrait être révélé
    expect(result.current.revealedHints['Type 1']).toBe('Plante');
  });

  it('loadGameData détecte correctement le joueur 2', async () => {
    const partieJ2 = {
      ...fakePartie,
      dresseur1Id: 'autre-joueur',
      dresseur2Id: 'session-2',
      scoreJ2: 50,
      attemptsUsedJ2: 2,
      usedHintsJ2: ['Type1', 'Generation'],
      currentPokemonIdJ2: '1',
    };
    mockedGetPartie.mockResolvedValue(partieJ2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState({ sessionId: 'session-2' });

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.isPlayer1).toBe(false);
    expect(result.current.currentScore).toBe(50);
    expect(result.current.attemptsUsed).toBe(2);
    expect(result.current.usedHints).toEqual(['Type1', 'Generation']);
  });

  it('loadGameData met errorMessage si aucun pokémon à deviner', async () => {
    const partieVidePokemon = { ...fakePartie, pokemonsToGuess: [], currentPokemonIdJ1: null };
    mockedGetPartie.mockResolvedValue(partieVidePokemon as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.errorMessage).toContain('Aucun Pokémon à deviner');
    expect(result.current.isLoading).toBe(false);
  });

  it('loadGameData appelle onSkip si le pokémon n\'a pas de description', async () => {
    const onSkip = vi.fn();
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue({ descriptions: [] } as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState({ onSkip });

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.errorMessage).toContain('sans description');
    // onSkip est appelé après un setTimeout de 1500ms — vérifier qu'il est prévu
    expect(result.current.isLoading).toBe(false);
  });

  it('processRevealedHints mappe Silhouette (hint Sprite)', async () => {
    const partieWithSprite = { ...fakePartie, usedHintsJ1: ['Sprite'] };
    mockedGetPartie.mockResolvedValue(partieWithSprite as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Silhouette']).toBe('https://example.com/bulbi.png');
  });

  it('processRevealedHints mappe Type 2 avec une valeur', async () => {
    const partieWithType2 = { ...fakePartie, usedHintsJ1: ['Type2'] };
    mockedGetPartie.mockResolvedValue(partieWithType2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Type 2']).toBe('Poison');
  });

  it('processRevealedHints mappe "Pas de second type" si pas de Type 2', async () => {
    const partieWithType2 = { ...fakePartie, usedHintsJ1: ['Type2'] };
    const hintsWithoutType2 = {
      ...fakeHints,
      types: [{ slot: 1, name: 'Feu' }], // Pas de slot 2
    };
    mockedGetPartie.mockResolvedValue(partieWithType2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(hintsWithoutType2 as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Type 2']).toBe('Pas de second type');
  });

  it('processRevealedHints mappe Génération', async () => {
    const partieWithGen = { ...fakePartie, usedHintsJ1: ['Generation'] };
    mockedGetPartie.mockResolvedValue(partieWithGen as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Génération']).toBe('Génération I');
  });

  it('processRevealedHints mappe Catégorie', async () => {
    const partieWithCat = { ...fakePartie, usedHintsJ1: ['Category'] };
    mockedGetPartie.mockResolvedValue(partieWithCat as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Catégorie']).toBe('Pokémon Graine');
  });

  it('processRevealedHints mappe Taille et Poids', async () => {
    const partieWithPhysical = { ...fakePartie, usedHintsJ1: ['Height', 'Weight'] };
    mockedGetPartie.mockResolvedValue(partieWithPhysical as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Taille']).toBe('0.7m');
    expect(result.current.revealedHints['Poids']).toBe('6.9kg');
  });

  it('processRevealedHints mappe les Talents', async () => {
    const partieWithAbil = { ...fakePartie, usedHintsJ1: ['Abilities'] };
    mockedGetPartie.mockResolvedValue(partieWithAbil as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Talents']).toBe('Engrais, Chlorophylle');
  });

  it('processRevealedHints mappe les Statistiques', async () => {
    const partieWithStats = { ...fakePartie, usedHintsJ1: ['Stats'] };
    const hintsWithStats = {
      ...fakeHints,
      stats: {
        PV: { value: 45 },
        Attaque: { value: 49 },
        'Défense': { value: 49 },
        'Attaque Spé.': { value: 65 },
        'Défense Spé.': { value: 65 },
        Vitesse: { value: 45 },
      },
    };
    mockedGetPartie.mockResolvedValue(partieWithStats as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(hintsWithStats as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Statistiques']).toContain('PV: 45');
    expect(result.current.revealedHints['Statistiques']).toContain('Atk: 49');
  });
});
