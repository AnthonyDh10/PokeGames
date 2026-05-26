import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../app/hooks/useTimer';

vi.mock('../../app/services/partieService', () => ({
  getTimer: vi.fn(),
}));

import { getTimer } from '../../app/services/partieService';
const mockedGetTimer = vi.mocked(getTimer);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimer', () => {
  it('timeRemaining a une valeur initiale de 60', () => {
    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    expect(result.current.timeRemaining).toBe(60);
  });

  it('startTimer appelle getTimer toutes les 1000ms', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });

    await act(async () => { vi.advanceTimersByTime(2500); });

    expect(mockedGetTimer).toHaveBeenCalledWith('p1', 's1');
    expect(mockedGetTimer.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('stopTimer arrête les appels à getTimer', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(1000); });

    const callsBeforeStop = mockedGetTimer.mock.calls.length;
    act(() => { result.current.stopTimer(); });
    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(mockedGetTimer.mock.calls.length).toBe(callsBeforeStop);
  });

  it('appelle onTimeout quand timeRemaining passe à 0', async () => {
    const onTimeout = vi.fn();
    mockedGetTimer.mockResolvedValue({ timeRemaining: 0, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onTimeout si timerDurationSeconds est -1 (infini)", async () => {
    const onTimeout = vi.fn();
    mockedGetTimer.mockResolvedValue({ timeRemaining: 0, timerDurationSeconds: -1 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('met à jour timeRemaining avec la valeur renvoyée par le serveur', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 42, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(result.current.timeRemaining).toBe(42);
  });

  it('ne plante pas si getTimer rejette (catch silencieux)', async () => {
    mockedGetTimer.mockRejectedValue(new Error('Network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Timer]'), expect.any(Error));
    warnSpy.mockRestore();
  });

  it('triggerHintAnimation ajoute l\'animation puis la supprime après 1500ms', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    let animPromise: Promise<void>;
    act(() => {
      animPromise = result.current.triggerHintAnimation('Type1', 20);
    });

    expect(result.current.hintAnimations['Type1']).toBe(20);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await animPromise!;
    });

    expect(result.current.hintAnimations['Type1']).toBeUndefined();
  });

  it('triggerTimerAnimation met à jour les états d\'animation', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => {
      result.current.triggerTimerAnimation(15);
    });

    // Les états initiaux doivent être définis immédiatement
    expect(result.current.currentTimePenalty).toBe(15);
    expect(result.current.showTimePenalty).toBe(true);
    expect(result.current.timerFlash).toBe(true);
    expect(result.current.timerShake).toBe(true);

    // runAllTimersAsync avance tous les timers et vide la file des microtasks entre chaque tick
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.showTimePenalty).toBe(false);
  });

  it('startTimer ne fait rien si partieId est undefined', async () => {
    const { result } = renderHook(() =>
      useTimer({ partieId: undefined, sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(200); });

    // getTimer ne doit pas être appelé si partieId est absent
    expect(mockedGetTimer).not.toHaveBeenCalled();
  });
});
