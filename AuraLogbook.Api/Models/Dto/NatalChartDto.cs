using System.Text.Json;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Provider-calculated natal chart placements for a user who opted to save birth details.</summary>
public sealed record NatalChartDto(string Provider, DateTimeOffset RetrievedAt, JsonElement Chart);
