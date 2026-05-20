import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSessionStore } from '../../app/store/sessionStore';

// Reset le store Zustand entre les tests
beforeEach(() => {
  useSessionStore.setState({
    sessionId: crypto.randomUUID(),
    playerName: '',
  });
  localStorage.clear();
});

describe('sessionStore', () => {
  it('a un sessionId au format UUID', () => {
    const { sessionId } = useSessionStore.getState();
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('setPlayerName met à jour le nom du joueur', () => {
    act(() => {
      useSessionStore.getState().setPlayerName('Sacha');
    });
    expect(useSessionStore.getState().playerName).toBe('Sacha');
  });

  it('le playerName initial est vide', () => {
    expect(useSessionStore.getState().playerName).toBe('');
  });

  it('deux appels de setPlayerName écrasent la valeur précédente', () => {
    act(() => {
      useSessionStore.getState().setPlayerName('Sacha');
      useSessionStore.getState().setPlayerName('Misty');
    });
    expect(useSessionStore.getState().playerName).toBe('Misty');
  });
});
