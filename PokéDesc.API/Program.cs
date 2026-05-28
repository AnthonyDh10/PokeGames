using PokéDesc.Data.Repositories;
using PokéDesc.Business.Services;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Strategies;
using PokéDesc.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;
using PokéDesc.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// =================================================================
// 1. Configuration des Services
// =================================================================

// --- Données JSON (lecture seule, chargées une fois au démarrage) ---
builder.Services.AddSingleton<IPokemonRepository>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var dataPath = Path.Combine(env.ContentRootPath, "Data");
    return new PokemonRepository(dataPath);
});

builder.Services.AddSingleton<ITypesRepository>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var dataPath = Path.Combine(env.ContentRootPath, "Data");
    return new TypesRepository(dataPath);
});

// --- Architecture N-tiers ---
// Singleton : pas d'état mutable par requête, dépend de IPokemonRepository (Singleton)
builder.Services.AddSingleton<IPokemonService, PokemonService>();
// Singleton : stratégies sans état — injectées dans PartieService
builder.Services.AddSingleton<IGameModeStrategy, StandardModeStrategy>();
builder.Services.AddSingleton<IGameModeStrategy, TypesModeStrategy>();
builder.Services.AddSingleton<IGameModeStrategy, DeZoomModeStrategy>();
// Singleton : stockage in-memory des parties actives (état du serveur)
builder.Services.AddSingleton<IGameSessionStore, GameSessionStore>();
// Singleton : stores in-memory génériques pour les mini-jeux (DeZoom, TypesGame)
builder.Services.AddSingleton(typeof(IMiniGameStore<>), typeof(MiniGameStore<>));
builder.Services.AddSingleton<IPartieService, PartieService>();
builder.Services.AddSingleton<ITimerService, TimerService>();
builder.Services.AddSingleton<ITypesGameService, TypesGameService>();
builder.Services.AddSingleton<IDeZoomService, DeZoomService>();

// --- API ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// --- CORS dynamique (dev = Vite, prod = domaine configuré via env var) ---
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
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

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseMiddleware<PokéDesc.API.Middleware.ExceptionMiddleware>();
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");

app.Run();
