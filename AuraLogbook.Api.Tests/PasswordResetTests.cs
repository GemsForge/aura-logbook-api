using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.Email;
using AuraLogbook.Api.Services.PasswordReset;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>
/// #329: token-based password recovery — generic responses, hashed single-use expiring tokens,
/// invalidation on reissue, password rules, throttling, and old password rejection.
/// Uses the real SQLite token repository against all ordered migrations.
/// </summary>
public sealed class PasswordResetTests : IDisposable
{
    private const string Email = "reset@example.test";
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"aura-reset-{Guid.NewGuid():N}.db");
    private readonly SqliteConnectionFactory _factory;
    private readonly User _user = new() { Id = 7, Email = Email, PasswordHash = PasswordHelper.HashPassword("OldPassword1") };
    private readonly Mock<IFileUserRepository> _users = new();
    private readonly CapturingEmailSender _mail = new();
    private readonly ManualClock _clock = new(new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero));
    private readonly PasswordResetOptions _options = new() { Enabled = true, ResetUrlBase = "http://ui.test/reset-password" };
    private readonly PasswordResetService _service;

    public PasswordResetTests()
    {
        using (var connection = new SqliteConnection($"Data Source={_dbPath}"))
        {
            connection.Open();
            var dir = Path.Combine("..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations");
            foreach (var file in Directory.EnumerateFiles(dir, "*.sql").OrderBy(x => x, StringComparer.Ordinal))
                MigrationTestDatabase.Execute(connection, File.ReadAllText(file));
        }
        _factory = new SqliteConnectionFactory(Options.Create(new DatabaseOptions { ConnectionString = $"Data Source={_dbPath}" }));

        _users.Setup(r => r.GetByEmailAsync(Email)).ReturnsAsync(_user);
        _users.Setup(r => r.GetByIdAsync(_user.Id)).ReturnsAsync(_user);
        _users.Setup(r => r.UpdateAsync(It.IsAny<User>())).ReturnsAsync(true);

        _service = new PasswordResetService(_users.Object, new SqlitePasswordResetTokenRepository(_factory), _mail,
            new MemoryCache(new MemoryCacheOptions()), Options.Create(_options), _clock, NullLogger<PasswordResetService>.Instance);
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        File.Delete(_dbPath);
    }

    private AuthController Controller() => new(Mock.Of<IUserService>(), null!, _service, Options.Create(_options));

    private async Task<string> RequestTokenAsync()
    {
        await _service.RequestResetAsync(Email);
        var link = _mail.Bodies.Last().Split('\n').Single(l => l.StartsWith(_options.ResetUrlBase));
        return Uri.UnescapeDataString(link[(link.IndexOf("token=", StringComparison.Ordinal) + 6)..]);
    }

    private List<string> StoredHashes()
    {
        using var db = _factory.CreateConnection();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "SELECT TokenHash FROM PasswordResetTokens";
        using var reader = cmd.ExecuteReader();
        var list = new List<string>();
        while (reader.Read()) list.Add(reader.GetString(0));
        return list;
    }

    [Fact]
    public async Task Forgot_password_response_is_identical_for_known_and_unknown_emails()
    {
        var known = Assert.IsType<OkObjectResult>(await Controller().ForgotPassword(new ForgotPasswordRequest { Email = Email }, default));
        var unknown = Assert.IsType<OkObjectResult>(await Controller().ForgotPassword(new ForgotPasswordRequest { Email = "nobody@example.test" }, default));

        Assert.Equal(known.StatusCode, unknown.StatusCode);
        Assert.Equal(System.Text.Json.JsonSerializer.Serialize(known.Value), System.Text.Json.JsonSerializer.Serialize(unknown.Value));
        Assert.Single(_mail.Bodies); // Only the real account receives mail.
    }

    [Fact]
    public async Task Only_the_token_hash_is_stored()
    {
        var token = await RequestTokenAsync();

        var hash = Assert.Single(StoredHashes());
        Assert.NotEqual(token, hash);
        Assert.Equal(PasswordResetService.HashToken(token), hash);
        Assert.True(token.Length >= 43); // 256-bit random token.
    }

    [Fact]
    public async Task Valid_token_resets_once_and_old_password_stops_working()
    {
        var token = await RequestTokenAsync();

        Assert.Equal(PasswordResetResult.Success, await _service.ResetPasswordAsync(token, "NewPassword1"));
        Assert.False(PasswordHelper.VerifyPassword("OldPassword1", _user.PasswordHash));
        Assert.True(PasswordHelper.VerifyPassword("NewPassword1", _user.PasswordHash));

        Assert.Equal(PasswordResetResult.InvalidOrExpiredToken, await _service.ResetPasswordAsync(token, "AnotherPass1"));
        Assert.True(PasswordHelper.VerifyPassword("NewPassword1", _user.PasswordHash));
    }

    [Fact]
    public async Task Expired_token_fails_without_changing_password()
    {
        var token = await RequestTokenAsync();
        var before = _user.PasswordHash;
        _clock.Advance(TimeSpan.FromMinutes(31));

        Assert.Equal(PasswordResetResult.InvalidOrExpiredToken, await _service.ResetPasswordAsync(token, "NewPassword1"));
        Assert.Equal(before, _user.PasswordHash);
    }

    [Fact]
    public async Task Altered_token_fails_without_changing_password()
    {
        var token = await RequestTokenAsync();
        var before = _user.PasswordHash;
        var altered = (token[0] == 'A' ? 'B' : 'A') + token[1..];

        var result = Assert.IsType<BadRequestObjectResult>(await Controller().ResetPassword(new ResetPasswordRequest { Token = altered, NewPassword = "NewPassword1" }, default));
        Assert.Equal(AuthController.InvalidResetTokenMessage, result.Value);
        Assert.Equal(before, _user.PasswordHash);
    }

    [Fact]
    public async Task Issuing_a_new_token_invalidates_the_earlier_one()
    {
        var first = await RequestTokenAsync();
        var second = await RequestTokenAsync();

        Assert.Equal(PasswordResetResult.InvalidOrExpiredToken, await _service.ResetPasswordAsync(first, "NewPassword1"));
        Assert.Equal(PasswordResetResult.Success, await _service.ResetPasswordAsync(second, "NewPassword1"));
    }

    [Theory]
    [InlineData(7)]
    [InlineData(73)]
    public async Task Passwords_outside_8_to_72_are_rejected_and_token_is_kept(int length)
    {
        var token = await RequestTokenAsync();

        Assert.Equal(PasswordResetResult.InvalidPassword, await _service.ResetPasswordAsync(token, new string('x', length)));
        Assert.Equal(PasswordResetResult.Success, await _service.ResetPasswordAsync(token, "NewPassword1"));
    }

    [Fact]
    public async Task Repeated_requests_for_one_email_are_throttled_silently()
    {
        for (var i = 0; i < 5; i++)
            await _service.RequestResetAsync(Email);

        Assert.Equal(_options.MaxRequestsPerEmail, _mail.Bodies.Count);
    }

    [Fact]
    public async Task Endpoints_return_404_when_feature_is_disabled()
    {
        _options.Enabled = false;
        Assert.IsType<NotFoundResult>(await Controller().ForgotPassword(new ForgotPasswordRequest { Email = Email }, default));
        Assert.IsType<NotFoundResult>(await Controller().ResetPassword(new ResetPasswordRequest { Token = "x", NewPassword = "NewPassword1" }, default));
        Assert.Empty(_mail.Bodies);
    }

    [Fact]
    public void Migration_creates_reset_token_table_with_unique_hash()
    {
        using var connection = MigrationTestDatabase.OpenAll();
        MigrationTestDatabase.Execute(connection, "INSERT INTO PasswordResetTokens (UserId,TokenHash,CreatedAt,ExpiresAt) VALUES (1,'h','now','later');");
        Assert.Null(MigrationTestDatabase.Scalar(connection, "SELECT UsedAt FROM PasswordResetTokens WHERE TokenHash='h';"));
        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO PasswordResetTokens (UserId,TokenHash,CreatedAt,ExpiresAt) VALUES (2,'h','now','later');"));
    }

    private sealed class CapturingEmailSender : IEmailSender
    {
        public List<string> Bodies { get; } = new();
        public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
        {
            Bodies.Add(body);
            return Task.CompletedTask;
        }
    }

    private sealed class ManualClock(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset _now = now;
        public void Advance(TimeSpan by) => _now += by;
        public override DateTimeOffset GetUtcNow() => _now;
    }
}
