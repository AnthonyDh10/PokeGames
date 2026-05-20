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

  it('startTimer appelle getTimer toutes les 100ms', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });

    await act(async () => { vi.advanceTimersByTime(300); });

    expect(mockedGetTimer).toHaveBeenCalledWith('p1', 's1');
    expect(mockedGetTimer.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('stopTimer arrête les appels à getTimer', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 50, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(200); });

    const callsBeforeStop = mockedGetTimer.mock.calls.length;
    act(() => { result.current.stopTimer(); });
    await act(async () => { vi.advanceTimersByTime(500); });

    expect(mockedGetTimer.mock.calls.length).toBe(callsBeforeStop);
  });

  it('appelle onTimeout quand timeRemaining passe à 0', async () => {
    const onTimeout = vi.fn();
    mockedGetTimer.mockResolvedValue({ timeRemaining: 0, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onTimeout si timerDurationSeconds est -1 (infini)", async () => {
    const onTimeout = vi.fn();
    mockedGetTimer.mockResolvedValue({ timeRemaining: 0, timerDurationSeconds: -1 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('met à jour timeRemaining avec la valeur renvoyée par le serveur', async () => {
    mockedGetTimer.mockResolvedValue({ timeRemaining: 42, timerDurationSeconds: 60 });

    const { result } = renderHook(() =>
      useTimer({ partieId: 'p1', sessionId: 's1', onTimeout: vi.fn() })
    );

    act(() => { result.current.startTimer(); });
    await act(async () => { vi.advanceTimersByTime(150); });

    expect(result.current.timeRemaining).toBe(42);
  });
});
