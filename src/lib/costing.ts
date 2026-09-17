import type { ProposalCosting, RequestType } from "./mock-data";

/**
 * Estampilla Pro-Cultura rate, applied only to "Capacitación".
 *
 * OPEN QUESTION: the product lead mentioned 1% once, the prototype uses 1.5%.
 * Do not change it without an explicit answer — see
 * docs/08-preguntas-abiertas-negocio.md, question 12.
 */
export const PRO_CULTURA_TAX_PERCENT = 1.5;
export const PRO_CULTURA_TAX_RATE = PRO_CULTURA_TAX_PERCENT / 100;

/**
 * Single source of the costing formula (docs/01 and docs/04):
 *   margin    = baseCost × margin%
 *   stamp     = baseCost × 1.5%   (only for "Capacitación")
 *   suggested = round(baseCost + margin + stamp)
 *   offered   = customOffered ?? suggested
 *
 * In production the backend is the authority for this calculation; the client
 * may only preview it.
 */
export function calculateCosting(
  type: RequestType,
  baseCostCop: number,
  expectedMarginPercent: number,
  customOffered?: number,
  requiresExternalAdvisor: boolean = false,
  externalAdvisorDetails?: string,
  negotiationNotes?: string,
): ProposalCosting {
  const isCapacitacion = type === "Capacitación";
  const proCulturaTaxPercent = isCapacitacion ? PRO_CULTURA_TAX_PERCENT : 0;
  const marginAmount = baseCostCop * (expectedMarginPercent / 100);
  const proCulturaTaxAmount = isCapacitacion ? Math.round(baseCostCop * PRO_CULTURA_TAX_RATE) : 0;
  const suggestedTotalCop = Math.round(baseCostCop + marginAmount + proCulturaTaxAmount);
  const totalOfferedCop = customOffered ?? suggestedTotalCop;

  return {
    requiresExternalAdvisor,
    externalAdvisorDetails,
    baseCostCop,
    expectedMarginPercent,
    proCulturaTaxPercent,
    proCulturaTaxAmount,
    suggestedTotalCop,
    totalOfferedCop,
    negotiationNotes,
  };
}
