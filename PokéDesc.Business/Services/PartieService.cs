using System.Collections.Concurrent;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

public class PartieService : IPartieService
{
    private readonly IPokemonService _pokemonService;
    private static readonly ConcurrentDictionary<string, Partie> _fakeGameStore = new();

    // Configuration des coûts des indices
    private static readonly Dictionary<string, int> HintCosts = new()
    {
        { "Type1", 15 },
        { "Type2", 15 },
        { "Generation", 10 },
        { "Category", 10 },
        { "Stats", 20 },
        { "Height", 5 },
        { "Weight", 5 },
        { "Abilities", 25 },
        { "Sprite", 30 }
    };
    
    // Pénalités de temps (en secondes) pour chaque indice
    private static readonly Dictionary<string, double> HintTimePenalties = new()
    {
        { "Type1", 5.0 },
        { "Type2", 5.0 },
        { "Generation", 3.0 },
        { "Category", 3.0 },
        { "Stats", 7.0 },
        { "Height", 2.0 },
        { "Weight", 2.0 },
        { "Abilities", 8.0 },
        { "Sprite", 30.0 }
    };

    private const int MaxAttempts = 3;
    private const int BaseScore = 100;

    private static readonly Dictionary<int, string> GenerationNames = GameConstants.GenerationNames;

    public PartieService(IPokemonService pokemonService)
    {
        _pokemonService = pokemonService;
    }

    public async Task<Partie> CreateGameAsync(string dresseurId)
    {
        var partie = new Partie
        {
            Id = Guid.NewGuid().ToString(), // Simulé, MongoDB le ferait auto
            CodeSession = GenerateSessionCode(),
            Dresseur1Id = dresseurId,
            PokemonsToGuess = new List<Pokemon>(),
            Statut = "EnAttente"
        };

        _fakeGameStore[partie.Id] = partie;
        return await Task.FromResult(partie);
    }

    public async Task<Partie> StartGameAsync(string partieId, string mode, bool isSolo = false,
        int nbPokemons = 3, List<int>? generations = null, int timerDuration = 60)
    {
        var partie = await GetGameAsync(partieId);

        // Marquer le mode solo dans la partie
        partie.ModeSolo = isSolo;

        if (mode == "Standard")
        {
            // Stocker les paramètres sur la partie
            partie.NbPokemons = nbPokemons;
            partie.SelectedGenerations = generations ?? Enumerable.Range(1, 8).ToList();
            partie.TimerDurationSeconds = timerDuration;

            // Récupérer la liste complète une seule fois, puis partitionner
            var allPokemon = await _pokemonService.GetAllPokemonsAsync();
            var legendaryMythicalPokemons = allPokemon.Where(p => p.Status.IsLegendary || p.Status.IsMythical).ToList();
            var basePokemons = allPokemon.Where(p => !p.Status.IsLegendary && !p.Status.IsMythical).ToList();

            // Filtrer par génération si nécessaire
            var genNames = partie.SelectedGenerations
                .Where(g => GenerationNames.ContainsKey(g))
                .Select(g => GenerationNames[g])
                .ToHashSet();

            if (genNames.Count < 8)
            {
                basePokemons = basePokemons
                    .Where(p => genNames.Contains(p.Generation?.NameEn ?? ""))
                    .ToList();
                legendaryMythicalPokemons = legendaryMythicalPokemons
                    .Where(p => genNames.Contains(p.Generation?.NameEn ?? ""))
                    .ToList();
            }

            // Filter out Pokémon without descriptions
            basePokemons = basePokemons
                .Where(p => p.Description != null && p.Description.Any())
                .ToList();
            legendaryMythicalPokemons = legendaryMythicalPokemons
                .Where(p => p.Description != null && p.Description.Any())
                .ToList();

            if (basePokemons.Count == 0)
                throw new ArgumentException("Aucun Pokémon de base trouvé pour les générations sélectionnées.");

            // Générer les tirages communs pour déterminer le type de chaque position
            var random = Random.Shared;
            var rarityDraws = new bool[nbPokemons];
            for (int i = 0; i < nbPokemons; i++)
            {
                // 1% de chance d'avoir un légendaire/mythique (fallback sur basePokemons si pool vide)
                rarityDraws[i] = legendaryMythicalPokemons.Count > 0 && random.Next(100) == 0;
            }

            // Génération d'une liste commune aux deux joueurs
            partie.PokemonsToGuess = SelectPokemonsBasedOnDraws(rarityDraws, basePokemons, legendaryMythicalPokemons, random);
            partie.Statut = "EnCours";

            // Initialiser les timers pour chaque joueur
            partie.TimerStartJ1 = DateTime.UtcNow;
            partie.TimeRemainingJ1 = timerDuration >= 0 ? timerDuration : -1; // -1 = infini
            partie.TimerStartJ2 = DateTime.UtcNow;
            partie.TimeRemainingJ2 = timerDuration >= 0 ? timerDuration : -1; // -1 = infini
        }
        else if (mode == "Types")
        {
            partie.Statut = "EnCours";
            partie.TimerStartJ1 = DateTime.UtcNow;
            partie.TimerStartJ2 = DateTime.UtcNow;
        }
        else if (mode == "DeZoom")
        {
            partie.SelectedGenerations = generations ?? Enumerable.Range(1, 9).ToList();
            partie.Statut = "EnCours";
        }
        else
        {
            throw new ArgumentException($"Mode de jeu '{mode}' inconnu.");
        }

        return partie;
    }

    private List<Pokemon> SelectPokemonsBasedOnDraws(
        bool[] rarityDraws,
        List<Pokemon> basePokemons,
        List<Pokemon> legendaryMythicalPokemons,
        Random random)
    {
        var selectedPokemons = new List<Pokemon>();

        foreach (var isRare in rarityDraws)
        {
            var sourceList = isRare ? legendaryMythicalPokemons : basePokemons;
            // Extra safeguard: filter out Pokémon without descriptions
            var validPokemons = sourceList
                .Where(p => p.Description != null && p.Description.Any())
                .ToList();

            if (validPokemons.Count == 0)
                throw new ArgumentException("Aucun Pokémon valide (avec description) trouvé pour la sélection.");

            var selectedPokemon = validPokemons[random.Next(validPokemons.Count)];
            selectedPokemons.Add(selectedPokemon);
        }

        return selectedPokemons;
    }

    public async Task<Partie> JoinGameAsync(string codeSession, string dresseurId)
    {
        // Normaliser le code de session (supprimer espaces et mettre en majuscules)
        var normalizedCode = codeSession?.Trim().ToUpper();
        
        var partie = _fakeGameStore.Values.FirstOrDefault(p => 
            p.CodeSession?.Trim().ToUpper() == normalizedCode);
            
        if (partie == null) 
            throw new KeyNotFoundException($"Partie introuvable avec le code '{codeSession}'. Codes disponibles: {string.Join(", ", _fakeGameStore.Values.Select(p => p.CodeSession))}");
        
        if (!string.IsNullOrEmpty(partie.Dresseur2Id))
            throw new ArgumentException("Cette partie a déjà deux joueurs.");
        
        partie.Dresseur2Id = dresseurId;
        partie.Statut = "Prêt"; // Les deux joueurs sont connectés, en attente de démarrage
        
        return await Task.FromResult(partie);
    }

    public async Task<Partie> GetGameAsync(string partieId)
    {
        if (!_fakeGameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");
        return await Task.FromResult(partie);
    }

    public async Task<Partie> UseHintAsync(string partieId, string dresseurId, string hintType)
    {
        var partie = await GetGameAsync(partieId);
        
        // Vérifier si c'est le tour du joueur (simplifié ici pour J1)
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        var usedHints = isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2;

        if (!HintCosts.ContainsKey(hintType))
        {
            throw new ArgumentException($"Type d'indice '{hintType}' inconnu.");
        }

        if (!usedHints.Contains(hintType))
        {
            usedHints.Add(hintType);
            
            // Appliquer la pénalité de temps (sauf si timer infini)
            if (HintTimePenalties.TryGetValue(hintType, out double timePenalty))
            {
                if (isJ1)
                {
                    // Ne pas appliquer de pénalité si le timer est infini (-1)
                    if (partie.TimeRemainingJ1 >= 0)
                    {
                        partie.TimeRemainingJ1 = Math.Max(0, partie.TimeRemainingJ1 - timePenalty);
                    }
                }
                else
                {
                    // Ne pas appliquer de pénalité si le timer est infini (-1)
                    if (partie.TimeRemainingJ2 >= 0)
                    {
                        partie.TimeRemainingJ2 = Math.Max(0, partie.TimeRemainingJ2 - timePenalty);
                    }
                }
            }
        }

        return partie;
    }

    public async Task<GuessResult> SubmitGuessAsync(string partieId, string dresseurId, string pokemonName)
    {
        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        
        // Si c'est le marqueur de timeout du frontend, gérer le timeout
        if (pokemonName == "__TIMEOUT__")
        {
            return await HandleTimeout(partie, isJ1);
        }
        
        // Vérifier si le temps est écoulé
        bool isTimedOut = CheckTimeout(partie, isJ1);
        if (isTimedOut)
        {
            return await HandleTimeout(partie, isJ1);
        }
        
        int currentIndex = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        var pokemonsList = partie.PokemonsToGuess;
        
        // Vérifier si la partie est finie pour ce joueur
        if (currentIndex >= pokemonsList.Count)
        {
            return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };
        }

        var targetPokemon = pokemonsList[currentIndex];
        
        // Normalisation pour la comparaison (minuscule, trim)
        bool isCorrect = string.Equals(targetPokemon.NameFr, pokemonName, StringComparison.OrdinalIgnoreCase);

        if (isCorrect)
        {
            // Calcul du score
            int points = CalculateScore(isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2);
            
            if (isJ1) partie.ScoreJ1 += points;
            else partie.ScoreJ2 += points;

            // Enregistrer le Pokémon complété
            RecordCompletedPokemon(partie, isJ1, targetPokemon, true, points);

            AdvanceToNextPokemon(partie, isJ1);

            return new GuessResult
            {
                IsCorrect = true,
                IsTurnFinished = true,
                PointsEarned = points,
                Message = $"Bravo ! C'était bien {targetPokemon.NameFr}.",
                UpdatedGame = partie,
                IsGameFinished = CheckIfGameFinished(partie, isJ1)
            };
        }
        else
        {
            // Mauvaise réponse
            if (isJ1) partie.AttemptsUsedJ1++;
            else partie.AttemptsUsedJ2++;

            int attemptsUsed = isJ1 ? partie.AttemptsUsedJ1 : partie.AttemptsUsedJ2;

            if (attemptsUsed >= MaxAttempts)
            {
                // Perdu pour ce Pokémon
                RecordCompletedPokemon(partie, isJ1, targetPokemon, false, 0);
                
                AdvanceToNextPokemon(partie, isJ1);
                
                return new GuessResult
                {
                    IsCorrect = false,
                    IsTurnFinished = true,
                    PointsEarned = 0,
                    Message = $"Dommage, c'était {targetPokemon.NameFr}. Vous passez au suivant.",
                    UpdatedGame = partie,
                    IsGameFinished = CheckIfGameFinished(partie, isJ1)
                };
            }
            else
            {
                // Encore des essais
                return new GuessResult
                {
                    IsCorrect = false,
                    IsTurnFinished = false,
                    PointsEarned = 0,
                    Message = $"Ce n'est pas ça. Il vous reste {MaxAttempts - attemptsUsed} essais.",
                    UpdatedGame = partie
                };
            }
        }
    }

    private void AdvanceToNextPokemon(Partie partie, bool isJ1)
    {
        if (isJ1)
        {
            partie.CurrentIndexJ1++;
            partie.AttemptsUsedJ1 = 0;
            partie.UsedHintsJ1.Clear();
        }
        else
        {
            partie.CurrentIndexJ2++;
            partie.AttemptsUsedJ2 = 0;
            partie.UsedHintsJ2.Clear();
        }
    }

    public void ResetTimer(string partieId, string dresseurId)
    {
        if (!_fakeGameStore.TryGetValue(partieId, out var partie))
            return;
            
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        double timerDuration = partie.TimerDurationSeconds >= 0 ? partie.TimerDurationSeconds : -1;
        
        if (isJ1)
        {
            partie.TimerStartJ1 = DateTime.UtcNow;
            partie.TimeRemainingJ1 = timerDuration;
        }
        else
        {
            partie.TimerStartJ2 = DateTime.UtcNow;
            partie.TimeRemainingJ2 = timerDuration;
        }
    }

    private void RecordCompletedPokemon(Partie partie, bool isJ1, Pokemon pokemon, bool wasGuessed, int pointsEarned)
    {
        var completedPokemon = new CompletedPokemon
        {
            PokemonId = pokemon.Id,
            PokemonName = pokemon.NameFr,
            WasGuessed = wasGuessed,
            AttemptsUsed = isJ1 ? partie.AttemptsUsedJ1 : partie.AttemptsUsedJ2,
            HintsUsed = new List<string>(isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2),
            PointsEarned = pointsEarned
        };

        if (isJ1)
            partie.CompletedPokemonsJ1.Add(completedPokemon);
        else
            partie.CompletedPokemonsJ2.Add(completedPokemon);
    }

    private int CalculateScore(List<string> usedHints)
    {
        int score = BaseScore;
        foreach (var hint in usedHints)
        {
            if (HintCosts.TryGetValue(hint, out int cost))
            {
                score -= cost;
            }
        }
        return Math.Max(0, score); // Pas de score négatif
    }

    private bool CheckIfGameFinished(Partie partie, bool isJ1)
    {
        int index = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        return index >= partie.PokemonsToGuess.Count;
    }

    private string GenerateSessionCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Repeat(chars, 6).Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
    }

    private bool CheckTimeout(Partie partie, bool isJ1)
    {
        DateTime? timerStart = isJ1 ? partie.TimerStartJ1 : partie.TimerStartJ2;
        double timeRemaining = isJ1 ? partie.TimeRemainingJ1 : partie.TimeRemainingJ2;

        if (timerStart == null)
            return false;

        // Si le timer est infini (-1), pas de timeout
        if (timeRemaining < 0)
            return false;

        var elapsed = (DateTime.UtcNow - timerStart.Value).TotalSeconds;
        return elapsed >= timeRemaining;
    }

    private async Task<GuessResult> HandleTimeout(Partie partie, bool isJ1)
    {
        int currentIndex = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        var pokemonsList = partie.PokemonsToGuess;

        if (currentIndex >= pokemonsList.Count)
        {
            return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };
        }

        var targetPokemon = pokemonsList[currentIndex];

        // Enregistrer le Pokémon comme raté (timeout)
        RecordCompletedPokemon(partie, isJ1, targetPokemon, false, 0);

        // NE PAS passer au Pokémon suivant automatiquement
        // Le joueur le fera manuellement avec le bouton du popup
        // Mais il faut incrémenter l'index pour que le frontend sache qu'on doit passer au suivant
        AdvanceToNextPokemon(partie, isJ1);

        return new GuessResult
        {
            IsCorrect = false,
            IsTurnFinished = true,
            IsTimeout = true,
            PointsEarned = 0,
            Message = $"Temps écoulé ! C'était {targetPokemon.NameFr}.",
            UpdatedGame = partie,
            IsGameFinished = CheckIfGameFinished(partie, isJ1)
        };
    }

    public double GetRemainingTime(string partieId, string dresseurId)
    {
        if (!_fakeGameStore.TryGetValue(partieId, out var partie))
            return 0;

        bool isJ1 = dresseurId == partie.Dresseur1Id;
        DateTime? timerStart = isJ1 ? partie.TimerStartJ1 : partie.TimerStartJ2;
        double timeRemaining = isJ1 ? partie.TimeRemainingJ1 : partie.TimeRemainingJ2;

        if (timerStart == null)
            return timeRemaining < 0 ? 0 : timeRemaining;

        var elapsed = (DateTime.UtcNow - timerStart.Value).TotalSeconds;

        // Mode infini : retourner le temps écoulé (stopwatch ascendant)
        if (timeRemaining < 0)
            return elapsed;

        return Math.Max(0, timeRemaining - elapsed);
    }

    public async Task<Partie> UpdateGameSettingsAsync(string partieId, int nbPokemons, List<int>? generations)
    {
        var partie = await GetGameAsync(partieId);

        // Valider les paramètres
        if (nbPokemons < 1 || nbPokemons > 6)
            throw new ArgumentException("Le nombre de Pokémon doit être entre 1 et 6.");

        // Mettre à jour les paramètres
        partie.NbPokemons = nbPokemons;
        partie.SelectedGenerations = generations ?? Enumerable.Range(1, 8).ToList();

        return partie;
    }

    public async Task<RematchStatusDto> MarkRematchReadyAsync(string partieId, string dresseurId)
    {
        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;

        if (isJ1) partie.RematchReadyJ1 = true;
        else partie.RematchReadyJ2 = true;

        bool bothReady = partie.RematchReadyJ1 && (partie.ModeSolo || partie.RematchReadyJ2);

        if (bothReady && string.IsNullOrEmpty(partie.RematchPartieId))
        {
            var newPartie = await CreateGameAsync(partie.Dresseur1Id);
            if (!string.IsNullOrEmpty(partie.Dresseur2Id))
            {
                newPartie.Dresseur2Id = partie.Dresseur2Id;
                newPartie.Statut = "Prêt";
            }
            await StartGameAsync(newPartie.Id, "Standard", partie.ModeSolo, partie.NbPokemons, partie.SelectedGenerations, partie.TimerDurationSeconds);
            partie.RematchPartieId = newPartie.Id;
        }

        return new RematchStatusDto
        {
            Player1Ready = partie.RematchReadyJ1,
            Player2Ready = partie.RematchReadyJ2 || partie.ModeSolo,
            RematchPartieId = partie.RematchPartieId,
        };
    }

    public async Task<Partie> MarkPlayerFinishedAsync(string partieId, string dresseurId)
    {
        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;

        if (isJ1) partie.FinishedJ1 = true;
        else partie.FinishedJ2 = true;

        // Si solo ou si les deux joueurs ont marqué la fin, basculer le statut
        bool bothFinished = partie.ModeSolo || (partie.Dresseur2Id != null && partie.FinishedJ1 && partie.FinishedJ2);
        if (bothFinished)
        {
            partie.Statut = "Termine";
        }

        return partie;
    }
}
