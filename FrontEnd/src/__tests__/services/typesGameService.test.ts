import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as typesGameService from '../../app/services/typesGameService';

vi.mock('../../app/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../app/services/api';
const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('typesGameService', () => {
  it('getAllTypes appelle GET /api/types-game/types', async () => {
    mockedGet.mockResolvedValue({ data: [{ id: 1, nameFr: 'Feu', nameEn: 'Fire' }] });

    const result = await typesGameService.getAllTypes();

    expect(mockedGet).toHaveBeenCalledWith('/api/types-game/types');
    expect(result).toHaveLength(1);
  });

  it('getTypesGame appelle GET /api/types-game/:partieId avec dresseurId en query', async () => {
    mockedGet.mockResolvedValue({ data: {} });

    await typesGameService.getTypesGame('partie-1', 'd1');

    expect(mockedGet).toHaveBeenCalledWith('/api/types-game/partie-1', { params: { dresseurId: 'd1' } });
  });

  it('submitTypesGuess appelle POST /api/types-game/:partieId/guess', async () => {
    mockedPost.mockResolvedValue({ data: { isCorrect: true } });

    await typesGameService.submitTypesGuess('partie-1', 'd1', 10, undefined, 5, 1);

    expect(mockedPost).toHaveBeenCalledWith('/api/types-game/partie-1/guess', {
      dresseurId: 'd1',
      type1Id: 10,
      type2Id: null,
      elapsedSeconds: 5,
      attemptCount: 1,
    });
  });

  it('getTypesGameResults appelle GET /api/types-game/:partieId/results', async () => {
    mockedGet.mockResolvedValue({ data: {} });

    await typesGameService.getTypesGameResults('partie-1');

    expect(mockedGet).toHaveBeenCalledWith('/api/types-game/partie-1/results');
  });

  it('markRematchReady appelle POST avec dresseurId en query', async () => {
    mockedPost.mockResolvedValue({ data: { player1Ready: true } });

    await typesGameService.markRematchReady('partie-1', 'd1');

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/types-game/partie-1/rematch-ready',
      {},
      { params: { dresseurId: 'd1' } },
    );
  });
});
