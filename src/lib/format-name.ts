/**
 * Converts a person's name into proper Spanish Title Case:
 * e.g. "JUAN DAVID QUINTERO PEÑA" -> "Juan David Quintero Peña"
 */
const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "y", "e", "da", "do", "dos", "das"]);

export function toTitleCase(text: string | null | undefined): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  const words = trimmed.toLowerCase().split(/\s+/);
  const formatted = words.map((word, idx) => {
    if (!word) return "";
    if (idx > 0 && LOWERCASE_WORDS.has(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return formatted.join(" ");
}
