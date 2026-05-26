using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PokemonController : ControllerBase
{
    private readonly IPokemonService _service;
    private readonly ILogger<PokemonController> _logger;

    public PokemonController(IPokemonService service, ILogger<PokemonController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon
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
            
            // Sinon, retourner tous les pokÃ©mons
            var pokemons = await _service.GetAllPokemonsAsync();
            return Ok(pokemons);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de GetAll");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon d'un type donnÃ©
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
            _logger.LogError(ex, "Erreur lors de GetByType({TypeName})", typeName);
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon lÃ©gendaires
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
            _logger.LogError(ex, "Erreur lors de GetLegendary");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon mythiques
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
            _logger.LogError(ex, "Erreur lors de GetMythical");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon lÃ©gendaires ou mythiques
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
            _logger.LogError(ex, "Erreur lors de GetLegendaryOrMythical");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon de base (premiers de leur chaÃ®ne d'Ã©volution)
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
            _logger.LogError(ex, "Erreur lors de GetBaseEvolution");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re la description censurÃ©e d'un PokÃ©mon
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
            _logger.LogError(ex, "Erreur lors de GetCensoredDescription({Id})", id);
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// RÃ©cupÃ¨re les indices pour deviner un PokÃ©mon
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
            _logger.LogError(ex, "Erreur lors de GetHints({Id})", id);
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

}
