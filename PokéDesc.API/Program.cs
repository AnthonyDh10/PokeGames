using PokéDesc.Data.Repositories;
using PokéDesc.Business.Services;
using PokéDesc.Business.Interfaces;
using Microsoft.AspNetCore.Hosting;

var builder = WebApplication.CreateBuilder(args);

// =================================================================
// 1. Configuration des Services
// =================================================================

// --- Données JSON (lecture seule, chargées une fois au démarrage) ---
builder.Services.AddSingleton<PokemonRepository>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var dataPath = Path.Combine(env.ContentRootPath, "Data");
    return new PokemonRepository(dataPath);
});

// --- Architecture N-tiers ---
builder.Services.AddScoped<IPokemonService, PokemonService>();
builder.Services.AddScoped<IPartieService, PartieService>();
builder.Services.AddSingleton<ITypesGameService>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    return new TypesGameService(Path.Combine(env.ContentRootPath, "Data"));
});
builder.Services.AddSingleton<IDeZoomService>(sp =>
{
    var repo = sp.GetRequiredService<PokemonRepository>();
    return new DeZoomService(repo);
});

// --- API ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- CORS dynamique (dev = Vite, prod = domaine configuré via env var) ---
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// =================================================================
// 2. Construction de l'application
// =================================================================

var app = builder.Build();

// =================================================================
// 3. Pipeline HTTP
// =================================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.MapControllers();

app.Run();
