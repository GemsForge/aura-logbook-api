using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using SQLitePCL;

var builder = WebApplication.CreateBuilder(args);
SQLitePCL.Batteries_V2.Init();
// Add services to the container
builder.Services.AddControllers(); // Add MVC-style controller support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors();

builder.Services.Configure<StorageSettings>(builder.Configuration.GetSection("Storage"));

// Repositories
builder.Services.AddScoped<IFileUserRepository, FileUserRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();

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

app.UseAuthorization(); // Required for JWT later

app.MapControllers(); // Enable attribute routing for controllers

app.Run();
