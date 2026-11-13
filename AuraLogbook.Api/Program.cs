using AuraLogbook.Api.Services.Helpers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.ReferenceData;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Services.Spotify;
using AuraLogbook.Api.Services.Email;
using AuraLogbook.Api.Services.PasswordReset;
using AuraLogbook.Api.Services.Faith;
using AuraLogbook.Api.Services.Astrology;
using AuraLogbook.Api.Services.PathwayActivities;

var builder = WebApplication.CreateBuilder(args);
SQLitePCL.Batteries_V2.Init();
// Add services to the container
builder.Services.AddControllers() // Add MVC-style controller support
.AddJsonOptions(options =>
 {
     options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
 });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Scheme = "Bearer",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            new List<string>()
        }
    });
});
builder.Services.AddCors();
builder.Services.Configure<SpotifyOptions>(builder.Configuration.GetSection(SpotifyOptions.SectionName));
builder.Services.Configure<FreeAstroApiOptions>(builder.Configuration.GetSection(FreeAstroApiOptions.SectionName));
// Prefer the documented deployment secret name while retaining ASP.NET's section-based alias.
builder.Services.PostConfigure<FreeAstroApiOptions>(options =>
    options.ApiKey = builder.Configuration["FREE_ASTRO_API_KEY"] ?? options.ApiKey);
builder.Services.Configure<AstrologyApiOptions>(builder.Configuration.GetSection(AstrologyApiOptions.SectionName));
builder.Services.AddDataProtection();
// Bound Spotify calls so a slow provider returns a recoverable error to the card.
builder.Services.AddHttpClient("Spotify", client => client.Timeout = TimeSpan.FromSeconds(10));

var jwtSettings = builder.Configuration.GetSection("Jwt");
// Validated before the app is built so a missing key stops startup instead of failing per request.
var jwtSigningKey = JwtSigningKey.Require(builder.Configuration);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(jwtSigningKey)
    };
});

builder.Services.Configure<StorageSettings>(builder.Configuration.GetSection("Storage"));
builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
builder.Services.AddSingleton<IDbConnectionFactory, SqliteConnectionFactory>();
builder.Services.AddSingleton<DatabaseMigrator>();
builder.Services.AddSingleton<JsonUserSeeder>();
builder.Services.AddScoped<IReferenceDataValidator, SqliteReferenceDataValidator>();
builder.Services.AddHttpClient<IBirthChartService, AstrologyApiBirthChartService>();

// Repositories
if (builder.Environment.IsDevelopment() || builder.Environment.IsStaging())
{
    builder.Services.AddScoped<IFileUserRepository, SqliteUserRepository>();
    builder.Services.AddScoped<IFileMoodRepository, SqliteMoodRepository>();
}
else
{
    builder.Services.AddScoped<IFileUserRepository, FileUserRepository>();
    builder.Services.AddScoped<IFileMoodRepository, FileMoodRepository>();
}
// Keep media metadata relational while image bytes stay in private, non-static storage.
builder.Services.AddScoped<IMoodMediaRepository, SqliteMoodMediaRepository>();
builder.Services.AddSingleton<IMoodMediaFileStore, PrivateMoodMediaFileStore>();
builder.Services.AddScoped<IReflectionRepository, SqliteReflectionRepository>();
builder.Services.AddScoped<IMoodCombinationRepository, SqliteMoodCombinationRepository>();
builder.Services.AddScoped<IAuraSeasonRepository, SqliteAuraSeasonRepository>();
// #389: private, pathway-tagged practice and insight-feedback records.
builder.Services.AddScoped<IPathwayActivityRepository, SqlitePathwayActivityRepository>();
builder.Services.AddScoped<IPathwayActivityService, PathwayActivityService>();
if (builder.Environment.IsDevelopment() || builder.Environment.IsStaging())
    builder.Services.AddScoped<IFileZodiacInsightsRepository, SqliteZodiacInsightsRepository>();
else
    builder.Services.AddSingleton<IFileZodiacInsightsRepository, FileZodiacInsightsRepository>();

// Services
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMoodService, MoodService>();
builder.Services.AddScoped<IMoodMediaService, MoodMediaService>();
builder.Services.AddScoped<IMoodStatsService, MoodStatsService>();
builder.Services.AddScoped<IInsightTriggerService, InsightTriggerService>();
builder.Services.AddScoped<ISpotifyConnectionRepository, SqliteSpotifyConnectionRepository>();
builder.Services.AddScoped<ISpotifyService, SpotifyService>();

// Password recovery (#329, #335). Development logs mail; other environments use SMTP when
// Email:Smtp is configured. Recovery is on only when enabled, a sender exists, and ResetUrlBase is valid.
var emailSenderAvailable = builder.Services.AddAuraEmailSender(builder.Configuration, builder.Environment);
var resetSection = builder.Configuration.GetSection(PasswordResetOptions.SectionName);
var resetOptions = resetSection.Get<PasswordResetOptions>() ?? new PasswordResetOptions();
builder.Services.Configure<PasswordResetOptions>(resetSection);
builder.Services.PostConfigure<PasswordResetOptions>(o =>
    o.Enabled = PasswordResetOptions.IsEffectivelyEnabled(o.Enabled, emailSenderAvailable, o.ResetUrlBase));
builder.Services.AddMemoryCache();
// #392: one sacred-text provider per supported framework; keys come from configuration/secrets only.
builder.Services.Configure<SacredTextOptions>(builder.Configuration.GetSection(SacredTextOptions.SectionName));
foreach (var providerName in new[] { nameof(ApiBibleProvider), nameof(QuranProvider), nameof(SefariaProvider) })
    builder.Services.AddHttpClient(providerName, client => client.Timeout = TimeSpan.FromSeconds(10));
builder.Services.AddSingleton<ISacredTextProvider, ApiBibleProvider>();
builder.Services.AddSingleton<ISacredTextProvider, QuranProvider>();
builder.Services.AddSingleton<ISacredTextProvider, SefariaProvider>();
builder.Services.AddSingleton<SacredTextService>();
// #373: FreeAstroAPI daily sign reading and moon-phase lookups; the key stays server-side and
// one shared pacer keeps both services within the provider's free-tier request rate.
builder.Services.Configure<FreeAstroApiOptions>(builder.Configuration.GetSection(FreeAstroApiOptions.SectionName));
builder.Services.AddSingleton<FreeAstroApiRequestPacer>();
builder.Services.AddHttpClient<IMoonPhaseMoodInsightsService, FreeAstroMoonPhaseMoodInsightsService>();
builder.Services.AddHttpClient<IDailyHoroscopeService, FreeAstroDailyHoroscopeService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IPasswordResetTokenRepository, SqlitePasswordResetTokenRepository>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddPasswordResetRateLimit(resetOptions);

builder.Services
    .AddHttpClient<IWeatherService, WeatherService>()
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));

var app = builder.Build();
app.Logger.LogInformation(
    "Aura Logbook starting in {EnvironmentName}. User seeding on startup: {SeedUsersOnStartup}",
    app.Environment.EnvironmentName,
    app.Configuration.GetValue<bool>("Database:SeedUsersOnStartup"));
app.Services.GetRequiredService<DatabaseMigrator>().ApplyMigrations();
if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Database:SeedUsersOnStartup"))
    await app.Services.GetRequiredService<JsonUserSeeder>().SeedUsersAsync();
app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader());

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (HttpsRedirectionPolicy.ShouldApply(app.Environment.IsDevelopment(), app.Urls))
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization(); // Required for JWT later

app.MapControllers(); // Enable attribute routing for controllers

app.MapGet("/health/database", (IDbConnectionFactory factory, IWebHostEnvironment environment) =>
{
    try
    {
        using var connection = factory.CreateConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM __SchemaMigrations;";
        var migrationCount = Convert.ToInt32(command.ExecuteScalar());
        return Results.Ok(new
        {
            status = "healthy",
            environment = environment.EnvironmentName,
            migrations = migrationCount
        });
    }
    catch (Exception exception)
    {
        app.Logger.LogError(exception, "Database health check failed");
        return Results.Problem("Database connection or migration status is unavailable.", statusCode: 503);
    }
});

app.Run();
