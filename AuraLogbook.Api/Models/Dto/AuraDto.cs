namespace AuraLogbook.Api.Models.Dto;

/// <summary>
/// The derived aura (#343) as an OKLCH tone plus plain-language contributors for the
/// "Why this color?" sheet. Clients derive text-safe tokens from it (#344).
/// </summary>
public sealed class AuraDto
{
    /// <summary>OKLCH hue in degrees, or null when there is nothing to blend yet (neutral aura).</summary>
    public double? Hue { get; init; }
    /// <summary>OKLCH chroma; kept gentle (0.04–0.16).</summary>
    public double Chroma { get; init; }
    /// <summary>OKLCH lightness of the aura surface tone.</summary>
    public double Lightness { get; init; }
    /// <summary>0–1 agreement of the inputs; opposing hues cancel toward 0.</summary>
    public double Strength { get; init; }
    /// <summary><see cref="Strength"/> × 100, the derived replacement for the old user-entered intensity.</summary>
    public int Intensity { get; init; }
    /// <summary>What fed the color, in plain words, e.g. "Your Earth sign".</summary>
    public IReadOnlyList<string> Contributors { get; init; } = [];
}
