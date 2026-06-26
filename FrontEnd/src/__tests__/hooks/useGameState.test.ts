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

const fakePlayer1 = {
  dresseurId: 'session-1',
  name: 'Sacha',
  role: 'Host' as const,
  isConnected: true,
  currentIndex: 0,
  score: 100,
  attemptsUsed: 1,
  usedHints: ['Type1'],
  timeRemaining: 60,
  rematchReady: false,
  currentPokemonId: '1',
  completedPokemons: [],
};

const fakePartie = {
  id: 'p1',
  codeSession: 'ABC',
  statut: 'EnCours',
  hostId: 'session-1',
  maxPlayers: 8,
  modeSolo: false,
  settings: { nbPokemons: 1, generations: [1], timerDuration: 60 },
  players: [fakePlayer1],
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
    expect(loadResult).toEqual({
      timerDurationSeconds: 60,
      sessionCode: 'ABC',
      isSolo: true, // 1 joueur dans players[] → considéré solo
    });
  });

  it('loadGameData charge les données du joueur courant (score, tentatives, indices)', async () => {
    mockedGetPartie.mockResolvedValue(fakePartie as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState({ sessionId: 'session-1' });

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

    // Type1 est dans usedHints du joueur, donc devrait être révélé
    expect(result.current.revealedHints['Type 1']).toBe('Plante');
  });

  it('loadGameData charge les données d\'un second joueur correctement', async () => {
    const fakePlayer2 = {
      dresseurId: 'session-2',
      name: 'Pierre',
      role: 'Guest' as const,
      isConnected: true,
      currentIndex: 0,
      score: 50,
      attemptsUsed: 2,
      usedHints: ['Type1', 'Generation'],
      timeRemaining: 60,
      rematchReady: false,
      currentPokemonId: '1',
      completedPokemons: [],
    };
    const partieJ2 = {
      ...fakePartie,
      players: [fakePlayer1, fakePlayer2],
    };
    mockedGetPartie.mockResolvedValue(partieJ2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState({ sessionId: 'session-2' });

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.currentScore).toBe(50);
    expect(result.current.attemptsUsed).toBe(2);
    expect(result.current.usedHints).toEqual(['Type1', 'Generation']);
  });

  it('loadGameData met errorMessage si aucun pokémon à deviner', async () => {
    const partieNoPokemon = {
      ...fakePartie,
      players: [{ ...fakePlayer1, currentPokemonId: null }],
    };
    mockedGetPartie.mockResolvedValue(partieNoPokemon as any);
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
    expect(result.current.isLoading).toBe(false);
  });

  it('processRevealedHints mappe Silhouette (hint Sprite)', async () => {
    const partieWithSprite = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Sprite'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithSprite as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Silhouette']).toBe('https://example.com/bulbi.png');
  });

  it('processRevealedHints mappe Type 2 avec une valeur', async () => {
    const partieWithType2 = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Type2'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithType2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Type 2']).toBe('Poison');
  });

  it('processRevealedHints mappe "Pas de second type" si pas de Type 2', async () => {
    const partieWithType2 = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Type2'] }],
    };
    const hintsWithoutType2 = {
      ...fakeHints,
      types: [{ slot: 1, name: 'Feu' }],
    };
    mockedGetPartie.mockResolvedValue(partieWithType2 as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(hintsWithoutType2 as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Type 2']).toBe('Pas de second type');
  });

  it('processRevealedHints mappe Génération', async () => {
    const partieWithGen = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Generation'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithGen as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Génération']).toBe('Génération I');
  });

  it('processRevealedHints mappe Catégorie', async () => {
    const partieWithCat = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Category'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithCat as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Catégorie']).toBe('Pokémon Graine');
  });

  it('processRevealedHints mappe Taille et Poids', async () => {
    const partieWithPhysical = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Height', 'Weight'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithPhysical as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Taille']).toBe('0.7m');
    expect(result.current.revealedHints['Poids']).toBe('6.9kg');
  });

  it('processRevealedHints mappe les Talents', async () => {
    const partieWithAbil = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Abilities'] }],
    };
    mockedGetPartie.mockResolvedValue(partieWithAbil as any);
    mockedGetCensored.mockResolvedValue(fakeDesc as any);
    mockedGetHints.mockResolvedValue(fakeHints as any);

    const { result } = renderGameState();
    await act(async () => { await result.current.loadGameData(); });

    expect(result.current.revealedHints['Talents']).toBe('Engrais, Chlorophylle');
  });

  it('processRevealedHints mappe les Statistiques', async () => {
    const partieWithStats = {
      ...fakePartie,
      players: [{ ...fakePlayer1, usedHints: ['Stats'] }],
    };
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
