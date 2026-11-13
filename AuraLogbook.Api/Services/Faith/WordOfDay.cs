namespace AuraLogbook.Api.Services.Faith;

/// <summary>An Aura-authored, tradition-neutral word and short reflection prompt for one day.</summary>
/// <param name="Date">The calendar day this word belongs to.</param>
/// <param name="Word">The single word of the day.</param>
/// <param name="Reflection">A gentle, non-directive prompt. Never scripture, never advice.</param>
public sealed record WordOfDayDto(DateOnly Date, string Word, string Reflection);

/// <summary>
/// Neutral Word of the Day for the Faith &amp; Religion pathway (#392). It needs no religious framework
/// and no provider, so it is always available. Selection is deterministic per date so every user and
/// every server sees the same word on the same day.
/// </summary>
public static class WordOfDayCatalog
{
    private static readonly (string Word, string Reflection)[] Words =
    [
        ("Gratitude", "What is one small thing you are thankful for right now?"),
        ("Rest", "Where could you allow yourself a pause today?"),
        ("Hope", "What are you quietly hoping for this week?"),
        ("Kindness", "Who might welcome a kind word from you today?"),
        ("Patience", "What is asking for a little more patience from you?"),
        ("Forgiveness", "Is there something you are ready to set down?"),
        ("Presence", "What do you notice when you slow down for one breath?"),
        ("Courage", "What would you do today if you felt a little braver?"),
        ("Stillness", "Where in your day is there room for quiet?"),
        ("Wonder", "What surprised or delighted you recently?"),
        ("Trust", "What are you learning to trust, in yourself or others?"),
        ("Humility", "What are you open to learning today?"),
        ("Joy", "What brought you a moment of joy lately?"),
        ("Compassion", "How could you meet yourself with more gentleness?"),
        ("Renewal", "What would a fresh start look like in one small area?"),
        ("Purpose", "What gives today meaning for you?"),
        ("Generosity", "What could you share freely today: time, attention, or care?"),
        ("Peace", "What helps you feel settled?"),
        ("Faithfulness", "What commitment matters most to you this week?"),
        ("Listening", "Whose voice, including your own, deserves more attention?"),
        ("Simplicity", "What could you let go of to make room for what matters?"),
        ("Belonging", "Where do you feel most at home?"),
        ("Grace", "Where have you received more than you expected?"),
        ("Light", "What brightened an ordinary moment recently?"),
        ("Reflection", "What would you like to remember about today?"),
        ("Service", "How might your strengths help someone else?"),
        ("Balance", "What needs a little more of your attention, and what needs less?"),
        ("Honesty", "What is true for you right now?"),
        ("Welcome", "What new thing could you make room for?"),
        ("Blessing", "What good in your life is easy to overlook?"),
        ("Steadfastness", "What keeps you steady when things change?"),
    ];

    /// <summary>Number of distinct words before the cycle repeats.</summary>
    public static int Count => Words.Length;

    /// <summary>Returns the word for <paramref name="date"/>; the same date always yields the same word.</summary>
    public static WordOfDayDto For(DateOnly date)
    {
        var (word, reflection) = Words[date.DayNumber % Words.Length];
        return new WordOfDayDto(date, word, reflection);
    }
}
