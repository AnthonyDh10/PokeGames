import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dezoomService from '../../app/services/dezoomService';

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

describe('dezoomService', () => {
  it('getDeZoomGame appelle GET /api/dezoom/:id avec dresseurId', async () => {
    mockedGet.mockResolvedValue({ data: { id: 'p1' } });

    await dezoomService.getDeZoomGame('p1', 'd1');

    expect(mockedGet).toHaveBeenCalledWith('/api/dezoom/p1', expect.objectContaining({ params: { dresseurId: 'd1' } }));
  });

  it('submitDeZoomGuess appelle POST /api/dezoom/:id/guess', async () => {
    mockedPost.mockResolvedValue({ data: { isCorrect: true } });

    await dezoomService.submitDeZoomGuess('p1', 'd1', 'Bulbizarre', 10, 1);

    expect(mockedPost).toHaveBeenCalledWith('/api/dezoom/p1/guess', {
      dresseurId: 'd1',
      pokemonNameFr: 'Bulbizarre',
      elapsedSeconds: 10,
      attemptCount: 1,
    });
  });

  it('getDeZoomResults appelle GET /api/dezoom/:id/results', async () => {
    mockedGet.mockResolvedValue({ data: {} });

    await dezoomService.getDeZoomResults('p1');

    expect(mockedGet).toHaveBeenCalledWith('/api/dezoom/p1/results');
  });

  it('markDeZoomRematchReady appelle POST avec dresseurId en query', async () => {
    mockedPost.mockResolvedValue({ data: {} });

    await dezoomService.markDeZoomRematchReady('p1', 'd1');

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/dezoom/p1/rematch-ready',
      {},
      { params: { dresseurId: 'd1' } },
    );
  });
});
