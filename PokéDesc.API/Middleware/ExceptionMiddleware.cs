namespace PokéDesc.API.Middleware;

/// <summary>
/// Middleware centralisé de gestion des exceptions.
/// Mappe les exceptions métier vers les codes HTTP appropriés,
/// évitant la répétition de try/catch dans chaque action de controller.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            // Autorisation refusée (action réservée à l'hôte) — 403 Forbidden
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Conflit d'état (lobby plein, partie déjà démarrée…) — 409 Conflict
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
        catch (BadHttpRequestException ex)
        {
            // Erreur cliente (corps tronqué, connexion coupée) — pas un bug serveur
            _logger.LogWarning("Bad HTTP request on {Method} {Path}: {Message}",
                context.Request.Method, context.Request.Path, ex.Message);
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Requête invalide." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Erreur serveur" });
        }
    }
}
