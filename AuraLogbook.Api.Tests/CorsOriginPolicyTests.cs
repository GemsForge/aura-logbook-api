using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AuraLogbook.Api.Configuration;

namespace AuraLogbook.Api.Tests;

public sealed class CorsOriginPolicyTests
{
    [Fact]
    public void ConfiguredOriginReceivesCorsHeadersAndUnlistedOriginDoesNot()
    {
        using var loggerFactory = LoggerFactory.Create(_ => { });
        var corsService = new CorsService(Options.Create(new CorsOptions()), loggerFactory);
        var policy = CorsOriginPolicy.Create(["https://aura.example"]);

        var allowedResponse = Evaluate(corsService, policy, "https://aura.example");
        var blockedResponse = Evaluate(corsService, policy, "https://other.example");

        Assert.Equal("https://aura.example", allowedResponse.Response.Headers["Access-Control-Allow-Origin"].ToString());
        Assert.False(blockedResponse.Response.Headers.ContainsKey("Access-Control-Allow-Origin"));
    }

    [Fact]
    public void ProductionRequiresConfiguredAllowedOrigin()
    {
        var configuration = new ConfigurationBuilder().Build();
        var environment = new TestHostEnvironment(Environments.Production);

        var exception = Assert.Throws<InvalidOperationException>(() => CorsOriginPolicy.Create(configuration, environment));

        Assert.Contains("Cors:AllowedOrigins", exception.Message);
    }

    [Fact]
    public void DevelopmentCanUseOriginsFromConfiguration()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:58407",
                ["Cors:AllowedOrigins:1"] = "http://127.0.0.1:58407",
            })
            .Build();
        var environment = new TestHostEnvironment(Environments.Development);

        var policy = CorsOriginPolicy.Create(configuration, environment);

        Assert.Contains("http://localhost:58407", policy.Origins);
        Assert.Contains("http://127.0.0.1:58407", policy.Origins);
    }

    private static DefaultHttpContext Evaluate(ICorsService corsService, CorsPolicy policy, string origin)
    {
        var context = new DefaultHttpContext();
        context.Request.Headers.Origin = origin;
        corsService.ApplyResult(corsService.EvaluatePolicy(context, policy), context.Response);
        return context;
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "AuraLogbook.Api.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
