using System.Text.Json;
using AuraLogbook.Api.Services.Faith;
using Xunit;

namespace AuraLogbook.Api.Tests;

/// <summary>
/// Reader book names must resolve even when a Bible abbreviates its display names
/// (the configured API.Bible text names Psalms "Psalm" and Genesis "Gen.").
/// </summary>
public class BibleBookIdsTests
{
    [Theory]
    [InlineData("Psalms", "PSA")]
    [InlineData("psalm", "PSA")]
    [InlineData("Proverb", "PRO")]
    [InlineData("Genesis", "GEN")]
    [InlineData("1  Corinthians", "1CO")]
    [InlineData("Song of Songs", "SNG")]
    [InlineData("Revelation", "REV")]
    public void Maps_reader_book_names_to_usfm_ids(string book, string expected) =>
        Assert.Equal(expected, BibleBookIds.TryGet(book));

    [Fact]
    public void Unknown_books_fall_back_to_the_providers_own_names()
    {
        Assert.Null(BibleBookIds.TryGet("Tobit"));
        var book = JsonDocument.Parse("""{"id":"TOB","name":"Tob.","nameLong":"Tobit","abbreviation":"Tob"}""").RootElement;
        Assert.True(BibleBookIds.NameMatches(book, "tobit"));
        Assert.False(BibleBookIds.NameMatches(book, "Judith"));
    }
}
