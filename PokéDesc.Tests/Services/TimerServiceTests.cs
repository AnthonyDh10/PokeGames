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
    public void GetRemainingTime_ForHost_ReturnsPositiveValue()
    {
        var partie = new Partie { Id = "partie-1" };
        partie.InitHost("dresseur-1", "Hôte");
        partie.GetPlayer("dresseur-1")!.State = new PlayerGameState { TimerStart = DateTime.UtcNow, TimeRemaining = 60.0 };
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        var remaining = _service.GetRemainingTime("partie-1", "dresseur-1");

        Assert.True(remaining >= 0);
        Assert.True(remaining <= 60.0);
    }

    [Fact]
    public void GetRemainingTime_ForUnknownPlayer_ThrowsKeyNotFoundException()
    {
        var partie = new Partie { Id = "partie-1" };
        partie.InitHost("dresseur-1", "Hôte");
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        Assert.Throws<KeyNotFoundException>(() => _service.GetRemainingTime("partie-1", "inconnu"));
    }

    [Fact]
    public void ResetTimer_ForHost_ResetsTimeRemaining()
    {
        var partie = new Partie { Id = "partie-1", TimerDurationSeconds = 60 };
        partie.InitHost("dresseur-1", "Hôte");
        partie.GetPlayer("dresseur-1")!.State.TimeRemaining = 10;
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        _service.ResetTimer("partie-1", "dresseur-1");

        var state = partie.GetPlayer("dresseur-1")!.State;
        Assert.Equal(60, state.TimeRemaining, precision: 1);
        Assert.NotNull(state.TimerStart);
    }

    [Fact]
    public void ResetTimer_ForGuest_ResetsTimeRemaining()
    {
        var partie = new Partie { Id = "partie-1", TimerDurationSeconds = 45 };
        partie.InitHost("dresseur-1", "Hôte");
        partie.Join("dresseur-2", "Invité");
        partie.GetPlayer("dresseur-2")!.State.TimeRemaining = 5;
        _sessionStoreMock.Setup(s => s.Get("partie-1")).Returns(partie);

        _service.ResetTimer("partie-1", "dresseur-2");

        var state = partie.GetPlayer("dresseur-2")!.State;
        Assert.Equal(45, state.TimeRemaining, precision: 1);
        Assert.NotNull(state.TimerStart);
    }
}
