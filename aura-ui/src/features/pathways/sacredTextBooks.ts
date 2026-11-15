/**
 * Canonical book names the sacred-text reader offers in its "Book or work" picker.
 *
 * Providers look books up by exact name (API.Bible compares book names; Sefaria resolves its own
 * index titles), so free text such as "Proverb" fails as an unavailable section. Each list uses the
 * spelling its provider accepts; the lists are kept in canonical order and sorted for display. The Muslim reader navigates by surah number and
 * has no book list.
 */

/** Protestant 66-book order, using API.Bible / World English Bible book names. */
export const CHRISTIAN_BOOKS: readonly string[] = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum",
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

/** Tanakh order (Torah, Prophets, Writings), using Sefaria index titles. */
export const JEWISH_BOOKS: readonly string[] = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "I Samuel", "II Samuel", "I Kings", "II Kings", "Isaiah", "Jeremiah", "Ezekiel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
  "Zechariah", "Malachi",
  "Psalms", "Proverbs", "Job", "Song of Songs", "Ruth", "Lamentations", "Ecclesiastes", "Esther",
  "Daniel", "Ezra", "Nehemiah", "I Chronicles", "II Chronicles",
];

/**
 * Returns the picker options for a framework, sorted alphabetically (numbered books compare by number,
 * so "1 John" precedes "2 John"). A book already open in the reader (for example from a
 * provider-formatted reference) is kept as an option so the picker never shows a blank value.
 */
export function sacredTextBookOptions(framework: "christian" | "jewish", current = ""): string[] {
  const books = framework === "jewish" ? JEWISH_BOOKS : CHRISTIAN_BOOKS;
  const match = books.find((book) => book.toLowerCase() === current.trim().toLowerCase());
  const options = current.trim() && !match ? [current.trim(), ...books] : [...books];
  return options.sort((left, right) => left.localeCompare(right, "en", { numeric: true, sensitivity: "base" }));
}
