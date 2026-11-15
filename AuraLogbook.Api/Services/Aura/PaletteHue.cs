using System.Globalization;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>Converts the displayed sRGB palette color to its OKLCH hue without assigning a second color meaning.</summary>
public static class PaletteHue
{
    /// <summary>Returns a hue in degrees for a #RRGGBB color, or null for an achromatic color.</summary>
    /// <exception cref="InvalidOperationException">The active reference color is not a valid six-digit hex value.</exception>
    public static double? FromHex(string hex)
    {
        if (hex.Length != 7 || hex[0] != '#' || !int.TryParse(hex.AsSpan(1), NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out var value))
            throw new InvalidOperationException("Active aura colors must use valid #RRGGBB values.");
        static double Linear(int channel)
        {
            var v = channel / 255.0;
            return v <= 0.04045 ? v / 12.92 : Math.Pow((v + 0.055) / 1.055, 2.4);
        }
        var r = Linear((value >> 16) & 255);
        var g = Linear((value >> 8) & 255);
        var b = Linear(value & 255);
        // Standard sRGB -> OKLab matrices; hue is the polar angle of its a/b coordinates.
        var l = Math.Cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        var m = Math.Cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        var s = Math.Cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
        var labB = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
        return Math.Sqrt(a * a + labB * labB) < 1e-6
            ? null
            : (Math.Atan2(labB, a) * 180 / Math.PI + 360) % 360;
    }
}
