import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../app/hooks/useGameState';
import { useRef } from 'react';

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
    const timerDurationRef = useRef(60);
    return useGameState({
      partieId: 'p1',
      sessionId: 'session-1',
      setChatContext: vi.fn(),
      timerDurationRef,
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

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.partie).toBeTruthy();
    expect(result.current.descriptions).toEqual(fakeDesc.descriptions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPokemonId).toBe('1');
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

    await act(async () => {
      await result.current.loadGameData();
    });

    expect(result.current.errorMessage).toContain('Network error');
    expect(result.current.isLoading).toBe(false);
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
});
