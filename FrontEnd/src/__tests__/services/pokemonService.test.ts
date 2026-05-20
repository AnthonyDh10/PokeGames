import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pokemonService from '../../app/services/pokemonService';

vi.mock('../../app/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../../app/services/api';
const mockedGet = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pokemonService', () => {
  it('getAllPokemons appelle GET /api/pokemon', async () => {
    mockedGet.mockResolvedValue({ data: [{ id: '1', nameFr: 'Bulbizarre' }] });

    const result = await pokemonService.getAllPokemons();

    expect(mockedGet).toHaveBeenCalledWith('/api/pokemon');
    expect(result).toHaveLength(1);
  });

  it('getCensoredDescription appelle GET /api/pokemon/:id/censored-description', async () => {
    const fakeDesc = ['*** a une graine sur le dos.'];
    mockedGet.mockResolvedValue({ data: fakeDesc });

    const result = await pokemonService.getCensoredDescription('1');

    expect(mockedGet).toHaveBeenCalledWith('/api/pokemon/1/censored-description');
    expect(result).toEqual(fakeDesc);
  });

  it('getHints appelle GET /api/pokemon/:id/hints', async () => {
    const fakeHints = { category: 'Pokémon Graine', generation: 'Génération I' };
    mockedGet.mockResolvedValue({ data: fakeHints });

    const result = await pokemonService.getHints('1');

    expect(mockedGet).toHaveBeenCalledWith('/api/pokemon/1/hints');
    expect(result).toEqual(fakeHints);
  });
});
