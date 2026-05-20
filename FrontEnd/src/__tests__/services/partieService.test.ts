import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as partieService from '../../app/services/partieService';

// Mock le module api.ts
vi.mock('../../app/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../../app/services/api';

const mockedPost = vi.mocked(api.post);
const mockedGet = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const fakePartie = { id: 'partie-1', codeSession: 'ABC123', statut: 'EnAttente' };
const fakeGuessResult = { isCorrect: true, pointsEarned: 100, message: 'Bravo !' };

describe('partieService', () => {
  it('createPartie appelle POST /api/partie/create avec dresseurId', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    const result = await partieService.createPartie('d1');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/create', { dresseurId: 'd1' });
    expect(result).toEqual(fakePartie);
  });

  it('joinPartie appelle POST /api/partie/join', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.joinPartie('ABC123', 'd2');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/join', {
      codeSession: 'ABC123',
      dresseurId: 'd2',
    });
  });

  it('getPartie appelle GET /api/partie/:id', async () => {
    mockedGet.mockResolvedValue({ data: fakePartie });

    const result = await partieService.getPartie('partie-1');

    expect(mockedGet).toHaveBeenCalledWith('/api/partie/partie-1');
    expect(result).toEqual(fakePartie);
  });

  it('startPartie en mode Standard envoie nbPokemons, generations, timerDuration', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', true, { nbPokemons: 3, generations: [1, 2], timerDuration: 60 });

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/start', expect.objectContaining({
      mode: 'Standard',
      isSolo: true,
      nbPokemons: 3,
      generations: [1, 2],
      timerDuration: 60,
    }));
  });

  it('submitGuess appelle POST /api/partie/:id/guess', async () => {
    mockedPost.mockResolvedValue({ data: fakeGuessResult });

    const result = await partieService.submitGuess('partie-1', 'd1', 'Bulbizarre');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/guess', {
      dresseurId: 'd1',
      pokemonName: 'Bulbizarre',
    });
    expect(result).toEqual(fakeGuessResult);
  });

  it('useHint appelle POST /api/partie/:id/hint', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.useHint('partie-1', 'd1', 'Type1');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/hint', {
      dresseurId: 'd1',
      hintType: 'Type1',
    });
  });

  it('getTimer appelle GET /api/partie/:id/timer/:dresseurId', async () => {
    const fakeTimer = { timeRemaining: 45, timerDurationSeconds: 60 };
    mockedGet.mockResolvedValue({ data: fakeTimer });

    const result = await partieService.getTimer('partie-1', 'd1');

    expect(mockedGet).toHaveBeenCalledWith('/api/partie/partie-1/timer/d1');
    expect(result).toEqual(fakeTimer);
  });
});
