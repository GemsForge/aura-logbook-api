namespace AuraLogbook.Api.Services.Aura;

/// <summary>
/// Western church seasons used as the Faith &amp; Religion base layer (#343, spec §6). Approximate by
/// design: Advent starts on the fourth Sunday before Christmas; Easter uses the Gregorian computus.
/// </summary>
public static class LiturgicalSeason
{
    /// <summary>Returns the season name and its hue for <paramref name="date"/>.</summary>
    public static (string Name, double Hue) For(DateOnly date)
    {
        var easter = Easter(date.Year);
        var ashWednesday = easter.AddDays(-46);
        var pentecost = easter.AddDays(49);
        var christmas = new DateOnly(date.Year, 12, 25);
        var adventStart = christmas.AddDays(-((int)christmas.DayOfWeek == 0 ? 28 : 21 + (int)christmas.DayOfWeek));

        if (date >= christmas || date <= new DateOnly(date.Year, 1, 5)) return ("Christmas", AuraHueTables.Gold);
        if (date >= adventStart) return ("Advent", AuraHueTables.Violet);
        if (date >= ashWednesday && date < easter) return ("Lent", AuraHueTables.Violet);
        if (date == pentecost) return ("Pentecost", AuraHueTables.Red);
        if (date >= easter && date < pentecost) return ("Easter", AuraHueTables.Gold);
        return ("Ordinary Time", AuraHueTables.Green);
    }

    /// <summary>Easter Sunday (Anonymous Gregorian algorithm).</summary>
    public static DateOnly Easter(int year)
    {
        int a = year % 19, b = year / 100, c = year % 100, d = b / 4, e = b % 4;
        int f = (b + 8) / 25, g = (b - f + 1) / 3, h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4, k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31, day = (h + l - 7 * m + 114) % 31 + 1;
        return new DateOnly(year, month, day);
    }
}
