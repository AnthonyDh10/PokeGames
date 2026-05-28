using Xunit;
using PokéDesc.Business.Constants;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Business.Services;
using PokéDesc.Domain.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Tests.Services;

/// <summary>
/// Tests unitaires pour MiniGameServiceBase&lt;TState&gt;.
/// Utilise une sous-classe concrète (stub) pour accéder aux méthodes protégées.
/// </summary>
public class MiniGameServiceBaseTests
{
    // ── Stub concret pour tester la classe abstraite ──────────────────────────

    private class TestState : IMiniGameState
    {
        public string PartieId { get; set; } = string.Empty;
        public MiniGamePlayerState Player1 { get; set; } = new();
        public MiniGamePlayerState Player2 { get; set; } = new();
        public string? RematchPartieId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // Stub en mémoire — évite Castle DynamicProxy sur le type imbriqué TestState
    private class TestStore : IMiniGameStore<TestState>
    {
        private readonly Dictionary<string, TestState> _data = new();
        public int SetCallCount { get; private set; }

        public TestState? Get(string partieId) =>
            _data.TryGetValue(partieId, out var s) ? s : null;

        public void Set(string partieId, TestState state)
        {
            _data[partieId] = state;
            SetCallCount++;
        }

        public void Cleanup(TimeSpan ttl) { }
    }

    private class TestService : MiniGameServiceBase<TestState>
    {
        public TestService(IMiniGameStore<TestState> store) : base(store) { }

        // Expositions publiques des méthodes protégées pour les tests
        public static MiniGamePlayerState ExposedGetPlayer(TestState s, string id) => GetPlayer(s, id);
        public static void ExposedEnsurePlayer2(TestState s, string id) => EnsurePlayer2(s, id);
        public static void ExposedRecordCorrectGuess(MiniGamePlayerState p, int elapsedSeconds, int attemptCount) => RecordCorrectGuess(p, elapsedSeconds, attemptCount);
        public static void ExposedRecordFailedAttempt(MiniGamePlayerState p, int elapsedSeconds, int attemptCount) => RecordFailedAttempt(p, elapsedSeconds, attemptCount);
        public static bool ExposedBothFinished(TestState s) => BothFinished(s);
        public static MiniGamePlayerResultDto ExposedBuildDto(MiniGamePlayerState p) => BuildPlayerResultDto(p);
        public RematchStatusDto ExposedMarkRematchCore(TestState s, string id, Func<string, TestState> factory)
            => MarkRematchCore(s, id, factory);
    }

    private readonly TestStore _store = new();
    private readonly TestService _service;

    public MiniGameServiceBaseTests()
    {
        _service = new TestService(_store);
    }

    // ─────────────────────────────────────────────
    // GetPlayer
    // ─────────────────────────────────────────────

    [Fact]
    public void GetPlayer_ReturnsPlayer1_WhenDresseurIdMatchesPlayer1()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = "p2" },
        };

        var player = TestService.ExposedGetPlayer(state, "p1");

        Assert.Same(state.Player1, player);
    }

    [Fact]
    public void GetPlayer_ReturnsPlayer2_WhenDresseurIdDoesNotMatchPlayer1()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = "p2" },
        };

        var player = TestService.ExposedGetPlayer(state, "p2");

        Assert.Same(state.Player2, player);
    }

    // ─────────────────────────────────────────────
    // EnsurePlayer2
    // ─────────────────────────────────────────────

    [Fact]
    public void EnsurePlayer2_AssignsId_WhenPlayer2IsNull()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        TestService.ExposedEnsurePlayer2(state, "p2");

        Assert.Equal("p2", state.Player2.DresseurId);
    }

    [Fact]
    public void EnsurePlayer2_DoesNotOverwrite_WhenPlayer2AlreadySet()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = "p2" },
        };

        TestService.ExposedEnsurePlayer2(state, "p3");

        Assert.Equal("p2", state.Player2.DresseurId); // inchangé
    }

    [Fact]
    public void EnsurePlayer2_DoesNothing_WhenIdIsPlayer1()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        TestService.ExposedEnsurePlayer2(state, "p1");

        Assert.Null(state.Player2.DresseurId); // Player2 reste vide
    }

    // ─────────────────────────────────────────────
    // RecordCorrectGuess
    // ─────────────────────────────────────────────

    [Fact]
    public void RecordCorrectGuess_SetsAllFields()
    {
        var player = new MiniGamePlayerState();

        TestService.ExposedRecordCorrectGuess(player, elapsedSeconds: 30, attemptCount: 2);

        Assert.True(player.IsGuessed);
        Assert.True(player.WasCorrect);
        Assert.Equal(30, player.ElapsedSeconds);
        Assert.Equal(2, player.AttemptCount);
    }

    // ─────────────────────────────────────────────
    // RecordFailedAttempt
    // ─────────────────────────────────────────────

    [Fact]
    public void RecordFailedAttempt_SetsAttemptCount_WhenNotMax()
    {
        var player = new MiniGamePlayerState();
        int belowMax = GameConstants.MaxAttempts - 1;

        TestService.ExposedRecordFailedAttempt(player, elapsedSeconds: 20, attemptCount: belowMax);

        Assert.Equal(belowMax, player.AttemptCount);
        Assert.False(player.IsGuessed); // pas encore terminé
    }

    [Fact]
    public void RecordFailedAttempt_SetsIsGuessed_WhenMaxAttemptsReached()
    {
        var player = new MiniGamePlayerState();

        TestService.ExposedRecordFailedAttempt(player, elapsedSeconds: 20, attemptCount: GameConstants.MaxAttempts);

        Assert.True(player.IsGuessed);
        Assert.Equal(20, player.ElapsedSeconds);
    }

    // ─────────────────────────────────────────────
    // BothFinished
    // ─────────────────────────────────────────────

    [Fact]
    public void BothFinished_ReturnsTrue_WhenSoloPlayer1Guessed()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1", IsGuessed = true },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        Assert.True(TestService.ExposedBothFinished(state));
    }

    [Fact]
    public void BothFinished_ReturnsFalse_WhenPlayer1NotGuessed()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1", IsGuessed = false },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        Assert.False(TestService.ExposedBothFinished(state));
    }

    [Fact]
    public void BothFinished_ReturnsTrue_WhenBothPlayersGuessed()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1", IsGuessed = true },
            Player2 = new MiniGamePlayerState { DresseurId = "p2", IsGuessed = true },
        };

        Assert.True(TestService.ExposedBothFinished(state));
    }

    [Fact]
    public void BothFinished_ReturnsFalse_WhenPlayer2NotYetGuessed()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1", IsGuessed = true },
            Player2 = new MiniGamePlayerState { DresseurId = "p2", IsGuessed = false },
        };

        Assert.False(TestService.ExposedBothFinished(state));
    }

    // ─────────────────────────────────────────────
    // BuildPlayerResultDto
    // ─────────────────────────────────────────────

    [Fact]
    public void BuildPlayerResultDto_MapsAllFields()
    {
        var player = new MiniGamePlayerState
        {
            DresseurId = "p1",
            IsGuessed = true,
            WasCorrect = true,
            ElapsedSeconds = 45,
            AttemptCount = 1,
        };

        var dto = TestService.ExposedBuildDto(player);

        Assert.Equal("p1", dto.DresseurId);
        Assert.True(dto.HasFinished);
        Assert.True(dto.WasCorrect);
        Assert.Equal(45, dto.ElapsedSeconds);
        Assert.Equal(1, dto.AttemptCount);
    }

    // ─────────────────────────────────────────────
    // MarkRematchCore
    // ─────────────────────────────────────────────

    [Fact]
    public void MarkRematchCore_Player1Ready_OnlyPlayer1()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = "p2" },
        };
        var status = _service.ExposedMarkRematchCore(state, "p1", id => new TestState { PartieId = id });

        Assert.True(status.Player1Ready);
        Assert.False(status.Player2Ready);
        Assert.Null(status.RematchPartieId); // pas encore créée
    }

    [Fact]
    public void MarkRematchCore_CreatesSoloRematch_WhenOnlyPlayer1()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        var status = _service.ExposedMarkRematchCore(state, "p1", id => new TestState { PartieId = id });

        Assert.True(status.Player1Ready);
        Assert.True(status.Player2Ready); // solo → Player2 considéré prêt
        Assert.NotNull(status.RematchPartieId);
        Assert.Equal(1, _store.SetCallCount);
    }

    [Fact]
    public void MarkRematchCore_CreatesDuoRematch_WhenBothReady()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1", RematchReady = true },
            Player2 = new MiniGamePlayerState { DresseurId = "p2" },
        };

        var status = _service.ExposedMarkRematchCore(state, "p2", id => new TestState { PartieId = id });

        Assert.True(status.Player1Ready);
        Assert.True(status.Player2Ready);
        Assert.NotNull(status.RematchPartieId);
        Assert.Equal(1, _store.SetCallCount);
    }

    [Fact]
    public void MarkRematchCore_DoesNotDuplicate_WhenCalledTwice()
    {
        var state = new TestState
        {
            Player1 = new MiniGamePlayerState { DresseurId = "p1" },
            Player2 = new MiniGamePlayerState { DresseurId = null },
        };

        // Premier appel → crée la rematch
        var status1 = _service.ExposedMarkRematchCore(state, "p1", id => new TestState { PartieId = id });
        // Deuxième appel → ne doit pas recréer
        var status2 = _service.ExposedMarkRematchCore(state, "p1", id => new TestState { PartieId = id });

        Assert.Equal(status1.RematchPartieId, status2.RematchPartieId);
        Assert.Equal(1, _store.SetCallCount);
    }
}
