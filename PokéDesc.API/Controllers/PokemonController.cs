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
    /// RÃ©cupÃ¨re tous les PokÃ©mon
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize)
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

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon d'un type donnÃ©
    /// </summary>
    [HttpGet("type/{typeName}")]
    public async Task<IActionResult> GetByType(string typeName)
    {
        var pokemons = await _service.GetPokemonsByTypeAsync(typeName);
        return Ok(pokemons);
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon lÃ©gendaires
    /// </summary>
    [HttpGet("legendary")]
    public async Task<IActionResult> GetLegendary()
    {
        var pokemons = await _service.GetLegendaryPokemonsAsync();
        return Ok(pokemons);
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon mythiques
    /// </summary>
    [HttpGet("mythical")]
    public async Task<IActionResult> GetMythical()
    {
        var pokemons = await _service.GetMythicalPokemonsAsync();
        return Ok(pokemons);
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon lÃ©gendaires ou mythiques
    /// </summary>
    [HttpGet("legendary-mythical")]
    public async Task<IActionResult> GetLegendaryOrMythical()
    {
        var pokemons = await _service.GetLegendaryOrMythicalPokemonsAsync();
        return Ok(pokemons);
    }

    /// <summary>
    /// RÃ©cupÃ¨re tous les PokÃ©mon de base (premiers de leur chaÃ®ne d'Ã©volution)
    /// </summary>
    [HttpGet("base-evolution")]
    public async Task<IActionResult> GetBaseEvolution()
    {
        var pokemons = await _service.GetBaseEvolutionPokemonsAsync();
        return Ok(pokemons);
    }

    /// <summary>
    /// RÃ©cupÃ¨re la description censurÃ©e d'un PokÃ©mon
    /// </summary>
    [HttpGet("{id}/censored-description")]
    public async Task<IActionResult> GetCensoredDescription(string id)
    {
        var descriptions = await _service.GetCensoredDescriptionAsync(id);
        return Ok(new { descriptions });
    }

    /// <summary>
    /// RÃ©cupÃ¨re les indices pour deviner un PokÃ©mon
    /// </summary>
    [HttpGet("{id}/hints")]
    public async Task<IActionResult> GetHints(string id)
    {
        var hints = await _service.GetPokemonHintsAsync(id);
        return Ok(hints);
    }

}
