using System.Text.Json;
using System.Text.Json.Serialization;

namespace AuraLogbook.Api.Models;

/// <summary>Reads legacy numeric pathway IDs while writing only stable string keys.</summary>
public sealed class LegacyPathwayKeyJsonConverter : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
            return reader.GetString() ?? SpiritualPathwayKeys.Mindfulness;
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var legacyId))
            return legacyId switch
            {
                1 => SpiritualPathwayKeys.Energy,
                2 => SpiritualPathwayKeys.Faith,
                _ => SpiritualPathwayKeys.Mindfulness
            };
        throw new JsonException("Pathway value must be a stable key or a legacy numeric ID.");
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options) => writer.WriteStringValue(value);
}
