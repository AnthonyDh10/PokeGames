using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[ProducesResponseType(StatusCodes.Status200OK)]
public class PokemonController : ControllerBase
{
    private readonly IPokemonService _service;

    public PokemonController(IPokemonService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize)
    {
        if (page.HasValue && pageSize.HasValue && page.Value > 0 && pageSize.Value > 0)
        {
            var (items, totalCount, totalPages) = await _service.GetPokemonsPaginatedAsync(page.Value, pageSize.Value);
            return Ok(new { items, page = page.Value, pageSize = pageSize.Value, totalCount, totalPages });
        }

        var pokemons = await _service.GetAllPokemonsAsync();
        return Ok(pokemons);
    }

    [HttpGet("type/{typeName}")]
    public async Task<ActionResult<IEnumerable<Pokemon>>> GetByType(string typeName)
    {
        var pokemons = await _service.GetPokemonsByTypeAsync(typeName);
        return Ok(pokemons);
    }

    [HttpGet("legendary")]
    public async Task<ActionResult<IEnumerable<Pokemon>>> GetLegendary()
    {
        var pokemons = await _service.GetLegendaryPokemonsAsync();
        return Ok(pokemons);
    }

    [HttpGet("mythical")]
    public async Task<ActionResult<IEnumerable<Pokemon>>> GetMythical()
    {
        var pokemons = await _service.GetMythicalPokemonsAsync();
        return Ok(pokemons);
    }

    [HttpGet("legendary-mythical")]
    public async Task<ActionResult<IEnumerable<Pokemon>>> GetLegendaryOrMythical()
    {
        var pokemons = await _service.GetLegendaryOrMythicalPokemonsAsync();
        return Ok(pokemons);
    }

    [HttpGet("base-evolution")]
    public async Task<ActionResult<IEnumerable<Pokemon>>> GetBaseEvolution()
    {
        var pokemons = await _service.GetBaseEvolutionPokemonsAsync();
        return Ok(pokemons);
    }

    [HttpGet("{id}/censored-description")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCensoredDescription(string id)
    {
        var descriptions = await _service.GetCensoredDescriptionAsync(id);
        return Ok(new { descriptions });
    }

    [HttpGet("{id}/hints")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHints(string id)
    {
        var hints = await _service.GetPokemonHintsAsync(id);
        return Ok(hints);
    }
}
