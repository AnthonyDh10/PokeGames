namespace PokéDesc.Business.Helpers;

public static class TimerCalculator
{
    public static bool IsTimedOut(DateTime? timerStart, double timeRemaining)
    {
        if (timerStart == null || timeRemaining < 0)
            return false;

        return (DateTime.UtcNow - timerStart.Value).TotalSeconds >= timeRemaining;
    }

    public static double GetRemaining(DateTime? timerStart, double timeRemaining)
    {
        if (timerStart == null)
            return timeRemaining < 0 ? 0 : timeRemaining;

        var elapsed = (DateTime.UtcNow - timerStart.Value).TotalSeconds;

        // Mode infini : retourner le temps écoulé (stopwatch ascendant)
        if (timeRemaining < 0)
            return elapsed;

        return Math.Max(0, timeRemaining - elapsed);
    }
}
