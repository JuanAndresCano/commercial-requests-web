import { describe, expect, it } from "vitest";
import {
  companyTypeLabel,
  formatDay,
  formatMonths,
  formatRate,
  monthsFromDays,
  programTypeLabel,
  rateVsArea,
  sentenceCase,
} from "./segment-format";
import { segmentTheme, sortProfiles } from "./segment-theme";
import type { SegmentProfile } from "@/lib/api/segments";

describe("segment formatting", () => {
  it("writes months with a decimal below 10 and none above", () => {
    expect(formatMonths(0.4)).toBe("menos de 1 mes");
    expect(formatMonths(1)).toBe("1 mes");
    expect(formatMonths(1.8)).toBe("1,8 meses");
    expect(formatMonths(6)).toBe("6 meses");
    expect(formatMonths(18.1)).toBe("18 meses");
  });

  it("converts days to months and rates to percentages with a decimal comma", () => {
    expect(monthsFromDays(61)).toBeCloseTo(2, 1);
    expect(formatRate(0.181)).toBe("18,1 %");
    expect(formatRate(0.27)).toBe("27 %");
  });

  it("writes a date without time-zone shifts", () => {
    expect(formatDay("2026-11-11")).toBe("11 de noviembre de 2026");
    expect(formatDay("2026-01-01")).toBe("1 de enero de 2026");
    expect(formatDay("not a date")).toBe("not a date");
  });

  it("compares a rate with the area rate it is given, in words and with sign", () => {
    expect(rateVsArea(0.363, 0.27)).toMatchObject({ direction: "above", text: "+9,3 pts sobre el área" });
    expect(rateVsArea(0.135, 0.27)).toMatchObject({ direction: "below", text: "−13,5 pts bajo el área" });
    expect(rateVsArea(0.3, 0.3)).toMatchObject({ direction: "equal", text: "igual que el área" });
    expect(rateVsArea(0.363, 0.3).text).toBe("+6,3 pts sobre el área");
  });

  it("shows the known program and company types with accents and a capital, and falls back to sentence case", () => {
    expect(programTypeLabel("FORMACION A LA MEDIDA PARA ORGANIZACIONES")).toBe(
      "Formación a la medida para organizaciones",
    );
    expect(programTypeLabel("CONSULTORIA / MENTORIA")).toBe("Consultoría / mentoría");
    expect(programTypeLabel("PROGRAMA NUEVO")).toBe("Programa nuevo");
    expect(programTypeLabel(null)).toBe("—");
    expect(companyTypeLabel("PUBLICA")).toBe("Pública");
    expect(companyTypeLabel("SIN_ANIMO_LUCRO")).toBe("Sin ánimo de lucro");
    expect(companyTypeLabel(undefined)).toBe("—");
    expect(sentenceCase("DIPLOMADO")).toBe("Diplomado");
  });
});

describe("segment theme", () => {
  const profile = (segment: number, strategy: string): SegmentProfile => ({
    segment,
    strategy,
    label: strategy,
    companyCount: 1,
    firmCount: 1,
    recencyMonthsMedian: 1,
    frequencyMedian: 1,
    typicalValueCop: 1,
    approvalRateMedian: 0.1,
    dominantProgramType: null,
    dominantNode: null,
  });

  it("sorts profiles by business order and sends unknown strategies last", () => {
    const sorted = sortProfiles([
      profile(1, "Reactivar"),
      profile(2, "Otra"),
      profile(3, "Cuidar"),
      profile(4, "Convertir"),
      profile(5, "Crecer"),
    ]);
    expect(sorted.map((p) => p.strategy)).toEqual(["Cuidar", "Crecer", "Convertir", "Reactivar", "Otra"]);
  });

  it("gives each known strategy its own marker shape and a neutral theme to unknown ones", () => {
    const shapes = ["Cuidar", "Crecer", "Convertir", "Reactivar"].map((s) => segmentTheme(s).marker);
    expect(new Set(shapes).size).toBe(4);
    expect(segmentTheme("Desconocida")).toBe(segmentTheme("Reactivar"));
  });
});
