import type { MoodEntry } from "@/features/mood/models/schema";

/**
 * Downloads the currently loaded journal entries as a portable, versioned JSON file.
 * The export contains only entries already returned for the signed-in user and active filters.
 */
export function downloadJournalExport(entries: MoodEntry[]): void {
  const payload = {
    format: "aura-logbook-journal",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aura-logbook-journal-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
