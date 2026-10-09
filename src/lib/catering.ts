export interface CateringPayload {
  requiresCatering: boolean;
  /** `null` clears the notes on an edit; on create it is simply "no notes". */
  cateringNotes: string | null;
}

/** Answers that mean "no catering", compared without case, accents, repeated spaces or closing punctuation. */
const NO_CATERING_ANSWERS = new Set(["no", "sin alimentacion", "no aplica", "ninguna", "ninguno", "n/a", "n.a", "na"]);

const YES_PREFIX = /^(?:sí|si)(?![\p{L}\p{N}])[\s.,:;\-–—]*(.*)$/iu;

/**
 * The wizard (and the "Información completa" form) has one free-text field for catering. The backend keeps
 * a yes/no flag plus notes, so the text is read explicitly: empty, "No", "Sin alimentación", "No aplica",
 * "Ninguna" or "N/A" is no catering, "Sí - …" is
 * catering with the part after "Sí" as notes (that is how the detail shows it, so editing round-trips),
 * and any other text is catering with that text as notes.
 */
export function cateringToPayload(text: string | undefined): CateringPayload {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { requiresCatering: false, cateringNotes: null };

  const plain = trimmed
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/[\s.,;:!¡?¿]+$/u, "");
  if (NO_CATERING_ANSWERS.has(plain)) return { requiresCatering: false, cateringNotes: null };

  const yes = YES_PREFIX.exec(trimmed);
  if (yes) return { requiresCatering: true, cateringNotes: yes[1].trim() || null };

  return { requiresCatering: true, cateringNotes: trimmed };
}
