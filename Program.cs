using AuraLogbook.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers(); // Add MVC-style controller support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register custom services
builder.Services.AddSingleton<DbConnectionFactory>();

var app = builder.Build();

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
