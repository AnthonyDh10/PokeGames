namespace PokéDesc.Domain.Models;

/// <summary>
/// Rôle d'un joueur dans une partie.
/// <see cref="Host"/> = créateur du lobby (autorisé à démarrer, modifier les settings, expulser).
/// <see cref="Guest"/> = joueur ayant rejoint via le code de session.
/// </summary>
public enum PlayerRole
{
    Host,
    Guest
}
