using AuraLogbook.Api.Models;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

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

var jwtSettings = builder.Configuration.GetSection("Jwt");
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
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
    };
});

builder.Services.Configure<StorageSettings>(builder.Configuration.GetSection("Storage"));
builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
builder.Services.AddSingleton<IDbConnectionFactory, SqliteConnectionFactory>();
builder.Services.AddSingleton<DatabaseMigrator>();
builder.Services.AddSingleton<JsonUserSeeder>();

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
if (builder.Environment.IsDevelopment() || builder.Environment.IsStaging())
    builder.Services.AddScoped<IFileZodiacInsightsRepository, SqliteZodiacInsightsRepository>();
else
    builder.Services.AddSingleton<IFileZodiacInsightsRepository, FileZodiacInsightsRepository>();

// Services
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMoodService, MoodService>();
builder.Services.AddScoped<IMoodStatsService, MoodStatsService>();
builder.Services.AddScoped<IInsightTriggerService, InsightTriggerService>();

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

app.UseAuthentication();
app.UseAuthorization(); // Required for JWT later

app.MapControllers(); // Enable attribute routing for controllers

app.Run();
