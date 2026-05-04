using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PokemonController : ControllerBase
{
    private readonly IPokemonService _service;

    public PokemonController(IPokemonService service)
    {
        _service = service;
    }

    /// <summary>
    /// Récupère tous les Pokémon
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize)
    {
        try
        {
            // Si page et pageSize sont fournis, utiliser la pagination
            if (page.HasValue && pageSize.HasValue && page.Value > 0 && pageSize.Value > 0)
            {
                var (items, totalCount, totalPages) = await _service.GetPokemonsPaginatedAsync(page.Value, pageSize.Value);
                return Ok(new
                {
                    items,
                    page = page.Value,
                    pageSize = pageSize.Value,
                    totalCount,
                    totalPages
                });
            }
            
            // Sinon, retourner tous les pokémons
            var pokemons = await _service.GetAllPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère tous les Pokémon d'un type donné
    /// </summary>
    [HttpGet("type/{typeName}")]
    public async Task<IActionResult> GetByType(string typeName)
    {
        try
        {
            var pokemons = await _service.GetPokemonsByTypeAsync(typeName);
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère tous les Pokémon légendaires
    /// </summary>
    [HttpGet("legendary")]
    public async Task<IActionResult> GetLegendary()
    {
        try
        {
            var pokemons = await _service.GetLegendaryPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère tous les Pokémon mythiques
    /// </summary>
    [HttpGet("mythical")]
    public async Task<IActionResult> GetMythical()
    {
        try
        {
            var pokemons = await _service.GetMythicalPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère tous les Pokémon légendaires ou mythiques
    /// </summary>
    [HttpGet("legendary-mythical")]
    public async Task<IActionResult> GetLegendaryOrMythical()
    {
        try
        {
            var pokemons = await _service.GetLegendaryOrMythicalPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère tous les Pokémon de base (premiers de leur chaîne d'évolution)
    /// </summary>
    [HttpGet("base-evolution")]
    public async Task<IActionResult> GetBaseEvolution()
    {
        try
        {
            var pokemons = await _service.GetBaseEvolutionPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère la description censurée d'un Pokémon
    /// </summary>
    [HttpGet("{id}/censored-description")]
    public async Task<IActionResult> GetCensoredDescription(string id)
    {
        try
        {
            var descriptions = await _service.GetCensoredDescriptionAsync(id);
            return Ok(new { descriptions });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

    /// <summary>
    /// Récupère les indices pour deviner un Pokémon
    /// </summary>
    [HttpGet("{id}/hints")]
    public async Task<IActionResult> GetHints(string id)
    {
        try
        {
            var hints = await _service.GetPokemonHintsAsync(id);
            return Ok(hints);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur serveur", error = ex.Message });
        }
    }

}
