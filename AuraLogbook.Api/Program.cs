using AuraLogbook.Api.Models;
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

// Repositories
builder.Services.AddScoped<IFileUserRepository, FileUserRepository>();
builder.Services.AddScoped<IFileMoodRepository, FileMoodRepository>();
// Services
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddSingleton<IFileZodiacInsightsRepository, FileZodiacInsightsRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMoodService, MoodService>();
builder.Services
    .AddHttpClient<IWeatherService, WeatherService>()
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));
var app = builder.Build();
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

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization(); // Required for JWT later

app.MapControllers(); // Enable attribute routing for controllers

app.Run();
