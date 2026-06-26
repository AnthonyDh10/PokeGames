import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as partieService from '../../app/services/partieService';

// Mock le module api.ts
vi.mock('../../app/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../../app/services/api';

const mockedPost = vi.mocked(api.post);
const mockedGet = vi.mocked(api.get);
const mockedPut = vi.mocked(api.put);

beforeEach(() => {
  vi.clearAllMocks();
});

const fakePartie = { id: 'partie-1', codeSession: 'ABC123', statut: 'EnAttente' };
const fakeGuessResult = { isCorrect: true, pointsEarned: 100, message: 'Bravo !' };

describe('partieService', () => {
  it('createPartie appelle POST /api/partie/create avec dresseurId et name', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    const result = await partieService.createPartie('d1', 'Sacha');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/create', { dresseurId: 'd1', name: 'Sacha' });
    expect(result).toEqual(fakePartie);
  });

  it('createPartie fonctionne sans name (défaut vide)', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.createPartie('d1');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/create', { dresseurId: 'd1', name: '' });
  });

  it('joinPartie appelle POST /api/partie/join avec codeSession, dresseurId et name', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.joinPartie('ABC123', 'd2', 'Pierre');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/join', {
      codeSession: 'ABC123',
      dresseurId: 'd2',
      name: 'Pierre',
    });
  });

  it('joinPartie fonctionne sans name (défaut vide)', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.joinPartie('ABC123', 'd2');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/join', {
      codeSession: 'ABC123',
      dresseurId: 'd2',
      name: '',
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

  it('startPartie inclut dresseurId quand fourni', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', false, { nbPokemons: 3, generations: [1], timerDuration: 60 }, 'Standard', 'host-id');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/start', expect.objectContaining({
      dresseurId: 'host-id',
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

  it('startPartie en mode DeZoom envoie les générations', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', false, { nbPokemons: 1, generations: [1, 2, 3], timerDuration: 90 }, 'DeZoom');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/start', expect.objectContaining({
      mode: 'DeZoom',
      isSolo: false,
      generations: [1, 2, 3],
      timerDuration: 90,
    }));
  });

  it('startPartie en mode DeZoom sans timerDuration n\'inclut pas le champ', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', false, { nbPokemons: 1, generations: [1], timerDuration: undefined as any }, 'DeZoom');

    const callArg = mockedPost.mock.calls[0][1] as any;
    expect(callArg.timerDuration).toBeUndefined();
  });

  it('startPartie en mode Types sans settings n\'envoie pas nbPokemons/generations', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', true, undefined, 'Types');

    const callArg = mockedPost.mock.calls[0][1] as any;
    expect(callArg.nbPokemons).toBeUndefined();
    expect(callArg.generations).toBeUndefined();
    expect(callArg.mode).toBe('Types');
  });

  it('startPartie en mode Types avec settings optionnels les inclut', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', true, { nbPokemons: 5, generations: [1], timerDuration: 45 }, 'Types');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/start', expect.objectContaining({
      nbPokemons: 5,
      generations: [1],
      timerDuration: 45,
    }));
  });

  it('resetTimer appelle POST /api/partie/:id/timer/reset', async () => {
    mockedPost.mockResolvedValue({ data: undefined });

    await partieService.resetTimer('partie-1', 'd1');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/timer/reset', { dresseurId: 'd1' });
  });

  it('updateGameSettings appelle PUT /api/partie/:id/settings avec dresseurId', async () => {
    mockedPut.mockResolvedValue({ data: fakePartie });

    const result = await partieService.updateGameSettings('partie-1', 'host-id', 5, [1, 2, 3]);

    expect(mockedPut).toHaveBeenCalledWith('/api/partie/partie-1/settings', {
      dresseurId: 'host-id',
      nbPokemons: 5,
      generations: [1, 2, 3],
    });
    expect(result).toEqual(fakePartie);
  });

  it('updateGameSettings avec timerDuration inclut le champ', async () => {
    mockedPut.mockResolvedValue({ data: fakePartie });

    await partieService.updateGameSettings('partie-1', 'host-id', 3, [1], 120);

    expect(mockedPut).toHaveBeenCalledWith('/api/partie/partie-1/settings', {
      dresseurId: 'host-id',
      nbPokemons: 3,
      generations: [1],
      timerDuration: 120,
    });
  });

  it('startPartie en mode DeZoom sans settings utilise les générations par défaut', async () => {
    mockedPost.mockResolvedValue({ data: fakePartie });

    await partieService.startPartie('partie-1', false, undefined, 'DeZoom');

    const callArg = mockedPost.mock.calls[0][1] as any;
    expect(callArg.generations).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(callArg.timerDuration).toBeUndefined();
  });

  it('markRematchReady appelle POST /api/partie/:id/rematch-ready avec dresseurId en body', async () => {
    const fakeStatus = { player1Ready: true, player2Ready: false };
    mockedPost.mockResolvedValue({ data: fakeStatus });

    const result = await partieService.markRematchReady('partie-1', 'd1');

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/partie/partie-1/rematch-ready',
      { dresseurId: 'd1' }
    );
    expect(result).toEqual(fakeStatus);
  });

  it('kickPlayer appelle POST /api/partie/:id/kick avec dresseurId et targetId', async () => {
    mockedPost.mockResolvedValue({ data: undefined });

    await partieService.kickPlayer('partie-1', 'host-id', 'target-id');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/kick', {
      dresseurId: 'host-id',
      targetId: 'target-id',
    });
  });

  it('leaveGame appelle POST /api/partie/:id/leave avec dresseurId', async () => {
    mockedPost.mockResolvedValue({ data: undefined });

    await partieService.leaveGame('partie-1', 'd1');

    expect(mockedPost).toHaveBeenCalledWith('/api/partie/partie-1/leave', { dresseurId: 'd1' });
  });
});
