/**
 * Utilities for fuzzy search and typo-tolerant string matching.
 */

export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates a fuzzy match score between pattern and target string.
 * Returns score between 0 (no match) and 1 (exact match).
 */
export function fuzzyScore(pattern: string, target: string): number {
  const p = normalizeText(pattern);
  const t = normalizeText(target);
  if (!p) return 1.0;
  if (!t) return 0.0;
  if (p === t) return 1.0;
  if (t.includes(p)) return 0.95;

  const pWords = p.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);

  // Check if all query words exist in target
  let allWordsFound = true;
  for (const pw of pWords) {
    if (!tWords.some((tw) => tw.startsWith(pw) || tw.includes(pw))) {
      allWordsFound = false;
      break;
    }
  }
  if (allWordsFound && pWords.length > 0) return 0.88;

  // Typo tolerance per word
  let matchedWordsCount = 0;
  for (const pw of pWords) {
    for (const tw of tWords) {
      if (tw.includes(pw) || pw.includes(tw)) {
        matchedWordsCount++;
        break;
      }
      const dist = levenshtein(pw, tw);
      const maxL = Math.max(pw.length, tw.length);
      const allowedDist = maxL >= 6 ? 2 : maxL >= 4 ? 1 : 0;
      if (dist <= allowedDist) {
        matchedWordsCount++;
        break;
      }
    }
  }

  if (matchedWordsCount === pWords.length && pWords.length > 0) {
    return 0.75;
  }

  // Full string Levenshtein fallback
  const fullDist = levenshtein(p, t);
  const maxLen = Math.max(p.length, t.length);
  const similarity = 1 - fullDist / maxLen;
  if (similarity >= 0.65) return similarity;

  return 0.0;
}

/**
 * Checks whether pattern matches target with a minimum threshold score.
 */
export function fuzzyMatch(pattern: string, target: string, threshold = 0.5): boolean {
  if (!pattern.trim()) return true;
  return fuzzyScore(pattern, target) >= threshold;
}

/**
 * Filters and sorts items based on fuzzy search matches across multiple fields.
 */
export function fuzzyFilter<T>(items: T[], query: string, getFields: (item: T) => string[]): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const scored = items
    .map((item) => {
      const fields = getFields(item);
      let bestScore = 0;
      for (const field of fields) {
        const score = fuzzyScore(trimmed, field);
        if (score > bestScore) bestScore = score;
      }
      return { item, score: bestScore };
    })
    .filter((entry) => entry.score >= 0.5)
    .sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.item);
}
