import { useCallback, useEffect, useRef, useState } from "react";
import { parseCopInput, parsePercentInput } from "@/lib/currency";

/** Quiet time after the last keystroke before the costing is saved. */
export const COSTING_AUTOSAVE_DELAY_MS = 800;

// Largest value the backend column holds (Decimal(14, 2)); beyond it the PUT would answer 400.
const MAX_AMOUNT = 999_999_999_999.99;

export type CostingField = "total" | "percent" | "amount";

/** What the form holds. A margin left empty is `undefined` (the backend stores null); 0 is a value. */
export interface CostingDraftValues {
  total: number;
  percent?: number;
  amount?: number;
}

const FIELDS: CostingField[] = ["total", "percent", "amount"];

type Parsed = { valid: true; value: number | undefined } | { valid: false };

const invalid: Parsed = { valid: false };

function parseAmount(text: string, emptyValue: number | undefined): Parsed {
  if (text.trim() === "") return { valid: true, value: emptyValue };
  const value = parseCopInput(text);
  return value === null || value > MAX_AMOUNT ? invalid : { valid: true, value };
}

const PARSERS: Record<CostingField, (text: string) => Parsed> = {
  // The total is required by the backend: an empty field means 0, as it always did.
  total: (text) => parseAmount(text, 0),
  amount: (text) => parseAmount(text, undefined),
  percent: (text) => {
    if (text.trim() === "") return { valid: true, value: undefined };
    const value = parsePercentInput(text);
    return value === null || value > 100 ? invalid : { valid: true, value };
  },
};

/** Text the field shows for a saved value: plain digits with "," as the decimal separator. */
function toText(field: CostingField, value: number | undefined): string {
  if (value === undefined || (field === "total" && value === 0)) return "";
  return String(value).replace(".", ",");
}

function toTexts(values: CostingDraftValues): Record<CostingField, string> {
  return {
    total: toText("total", values.total),
    percent: toText("percent", values.percent),
    amount: toText("amount", values.amount),
  };
}

function sameValues(a: CostingDraftValues, b: CostingDraftValues) {
  return a.total === b.total && a.percent === b.percent && a.amount === b.amount;
}

/**
 * Text state of the costing form. The user types es-CO formatted text; each field is parsed with
 * `parseCopInput` / `parsePercentInput`, and `onCommit` gets the parsed values only when all three
 * are valid and differ from what was last committed. Commits happen after a pause in typing
 * (COSTING_AUTOSAVE_DELAY_MS), on blur, or right away for `applyValue` (preset chips), so a
 * burst of keystrokes is one save. `source` is the saved costing: when it changes, fields not
 * being edited follow it, but text that already parses to the same number is left as typed.
 */
export function useCostingDraft(source: CostingDraftValues, onCommit: (values: CostingDraftValues) => void) {
  const [texts, setTexts] = useState(() => toTexts(source));
  const textsRef = useRef(texts);
  const committedRef = useRef<CostingDraftValues>(source);
  const dirtyRef = useRef(new Set<CostingField>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const commit = useCallback(() => {
    clearTimeout(timerRef.current);
    const total = PARSERS.total(textsRef.current.total);
    const percent = PARSERS.percent(textsRef.current.percent);
    const amount = PARSERS.amount(textsRef.current.amount);
    // An invalid field blocks the whole save and stays dirty, so the next valid edit saves everything.
    if (!total.valid || !percent.valid || !amount.valid) return;

    dirtyRef.current.clear();
    const values: CostingDraftValues = { total: total.value ?? 0, percent: percent.value, amount: amount.value };
    if (sameValues(values, committedRef.current)) return;
    committedRef.current = values;
    onCommitRef.current(values);
  }, []);

  const edit = useCallback((field: CostingField, text: string) => {
    textsRef.current = { ...textsRef.current, [field]: text };
    dirtyRef.current.add(field);
    setTexts(textsRef.current);
  }, []);

  const setText = useCallback(
    (field: CostingField, text: string) => {
      edit(field, text);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(commit, COSTING_AUTOSAVE_DELAY_MS);
    },
    [edit, commit],
  );

  const applyValue = useCallback(
    (field: CostingField, value: number) => {
      edit(field, toText(field, value));
      commit();
    },
    [edit, commit],
  );

  const blur = useCallback(
    (field: CostingField) => {
      if (dirtyRef.current.has(field)) commit();
    },
    [commit],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // The saved costing changed (a save came back, or someone else edited it).
  const { total: sourceTotal, percent: sourcePercent, amount: sourceAmount } = source;
  useEffect(() => {
    const incoming: CostingDraftValues = { total: sourceTotal, percent: sourcePercent, amount: sourceAmount };
    const nextTexts = { ...textsRef.current };
    const nextCommitted = { ...committedRef.current };
    if (!dirtyRef.current.has("total")) nextCommitted.total = incoming.total;
    if (!dirtyRef.current.has("percent")) nextCommitted.percent = incoming.percent;
    if (!dirtyRef.current.has("amount")) nextCommitted.amount = incoming.amount;
    for (const field of FIELDS) {
      if (dirtyRef.current.has(field)) continue;
      const current = PARSERS[field](textsRef.current[field]);
      if (!current.valid || current.value !== incoming[field]) nextTexts[field] = toText(field, incoming[field]);
    }
    committedRef.current = nextCommitted;
    if (FIELDS.some((field) => nextTexts[field] !== textsRef.current[field])) {
      textsRef.current = nextTexts;
      setTexts(nextTexts);
    }
  }, [sourceTotal, sourcePercent, sourceAmount]);

  const parsed = {
    total: PARSERS.total(texts.total),
    percent: PARSERS.percent(texts.percent),
    amount: PARSERS.amount(texts.amount),
  };
  // What to display and preview: the typed value while it is valid, the saved one otherwise.
  const values: CostingDraftValues = {
    total: (parsed.total.valid ? parsed.total.value : source.total) ?? 0,
    percent: parsed.percent.valid ? parsed.percent.value : source.percent,
    amount: parsed.amount.valid ? parsed.amount.value : source.amount,
  };

  return {
    texts,
    values,
    invalid: { total: !parsed.total.valid, percent: !parsed.percent.valid, amount: !parsed.amount.valid },
    /** Values last handed to `onCommit` (or last loaded from `source`): never a half-typed edit. */
    committed: () => committedRef.current,
    setText,
    applyValue,
    blur,
  };
}
