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

// Repositories
builder.Services.AddScoped<UserRepository>();
builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddSingleton<HealthCheckRepository>();
builder.Services.AddSingleton<FileUserRepository>();


builder.Services.AddSingleton<DbInitializer>();


var app = builder.Build();
app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader());
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DbInitializer>();
    await initializer.InitializeAsync();
}

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
