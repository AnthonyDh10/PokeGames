using Microsoft.AspNetCore.Mvc;

namespace PokéDesc.API.Controllers;

/// <summary>
/// Classe de base pour les controllers de mini-jeux.
/// Fournit le helper <see cref="ValidateDresseurId"/> pour éviter la duplication
/// de la garde <c>string.IsNullOrWhiteSpace</c> dans chaque action.
/// </summary>
public abstract class MiniGameControllerBase : ControllerBase
{
    /// <summary>
    /// Retourne un <c>BadRequest</c> si <paramref name="dresseurId"/> est null ou vide,
    /// sinon <c>null</c> (pas d'erreur, l'action peut continuer).
    /// </summary>
    /// <example>
    /// <code>
    /// if (ValidateDresseurId(dresseurId) is { } err) return err;
    /// </code>
    /// </example>
    protected IActionResult? ValidateDresseurId(string dresseurId)
        => string.IsNullOrWhiteSpace(dresseurId) ? BadRequest("dresseurId est requis.") : null;
}
