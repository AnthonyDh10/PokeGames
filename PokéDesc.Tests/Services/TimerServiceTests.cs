using Xunit;
using Moq;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Services;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.Tests.Services;

/// <summary>
/// Tests unitaires pour TimerService.
/// </summary>
public class TimerServiceTests
{
    private readonly Mock<IGameSessionStore> _sessionStoreMock;
    private readonly TimerService _service;

    public TimerServiceTests()
    {
        _sessionStoreMock = new Mock<IGameSessionStore>();
        _service = new TimerService(_sessionStoreMock.Object);
    }

    [Fact]
    public void GetTimerDuration_ReturnsConfiguredDuration()
    {
        var partie = new Partie { Id = "partie-1", TimerDurationSeconds = 90 };
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        var duration = _service.GetTimerDuration("partie-1");

        Assert.Equal(90, duration);
    }

    [Fact]
    public void GetRemainingTime_ForJ1_ReturnsPositiveValue()
    {
        var partie = new Partie
        {
            Id = "partie-1",
            Dresseur1Id = "dresseur-1",
            StateJ1 = new PlayerGameState { TimerStart = DateTime.UtcNow, TimeRemaining = 60.0 }
        };
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        var remaining = _service.GetRemainingTime("partie-1", "dresseur-1");

        Assert.True(remaining >= 0);
        Assert.True(remaining <= 60.0);
    }

    [Fact]
    public void ResetTimer_ForJ1_ResetsTimeRemaining()
    {
        var partie = new Partie
        {
            Id = "partie-1",
            Dresseur1Id = "dresseur-1",
            TimerDurationSeconds = 60,
            StateJ1 = new PlayerGameState { TimeRemaining = 10 }
        };
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        _service.ResetTimer("partie-1", "dresseur-1");

        Assert.Equal(60, partie.StateJ1.TimeRemaining, precision: 1);
        Assert.NotNull(partie.StateJ1.TimerStart);
    }

    [Fact]
    public void ResetTimer_ForJ2_ResetsTimeRemaining()
    {
        var partie = new Partie
        {
            Id = "partie-1",
            Dresseur1Id = "dresseur-1",
            Dresseur2Id = "dresseur-2",
            TimerDurationSeconds = 45,
            StateJ2 = new PlayerGameState { TimeRemaining = 5 }
        };
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        _service.ResetTimer("partie-1", "dresseur-2");

        Assert.Equal(45, partie.StateJ2.TimeRemaining, precision: 1);
        Assert.NotNull(partie.StateJ2.TimerStart);
    }
}
