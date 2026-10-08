export interface CateringPayload {
  requiresCatering: boolean;
  /** `null` clears the notes on an edit; on create it is simply "no notes". */
  cateringNotes: string | null;
}

const YES_PREFIX = /^(?:sí|si)(?![\p{L}\p{N}])[\s.,:;\-–—]*(.*)$/iu;

/**
 * The wizard (and the "Información completa" form) has one free-text field for catering. The backend keeps
 * a yes/no flag plus notes, so the text is read explicitly: empty or "No" is no catering, "Sí - …" is
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
    .replace(/[\s.!¡?¿]+$/u, "");
  if (plain === "no") return { requiresCatering: false, cateringNotes: null };

  const yes = YES_PREFIX.exec(trimmed);
  if (yes) return { requiresCatering: true, cateringNotes: yes[1].trim() || null };

  return { requiresCatering: true, cateringNotes: trimmed };
}
