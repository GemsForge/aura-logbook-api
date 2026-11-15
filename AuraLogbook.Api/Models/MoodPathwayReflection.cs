namespace AuraLogbook.Api.Models;

/// <summary>The optional interpretive invitation and deliberate response saved with one private mood entry.</summary>
/// <param name="SourceId">Stable reference identifying the invitation shown, rather than the user's current profile.</param>
/// <param name="Pathway">Pathway in use when the response was recorded.</param>
/// <param name="InsightType">Kind of invitation, kept distinct for later pathway metrics.</param>
/// <param name="Text">Snapshot of the invitation the user actually responded to.</param>
/// <param name="Response">Explicit resonates, maybe, or not-for-me choice.</param>
public sealed record MoodPathwayReflection(string SourceId, string Pathway, string InsightType, string Text, string Response);
