import { apiRequest } from "./client";

// Mirrors the backend contract of commercial-requests-backend (src/modules/segments).

export type SegmentSource = "EDUCONTINUA_HISTORICO" | "APP";

export interface SegmentRun {
  id: string;
  source: SegmentSource;
  /** Last delivery date in the data the model was fitted on (YYYY-MM-DD). */
  dataCutoffDate: string;
  /** Day the run was produced (YYYY-MM-DD). */
  runDate: string;
  k: number;
  silhouette: number;
  ariMean: number;
  ariStd: number;
  universeSize: number;
  /** Approval rate of the whole area (0..1): the reference every segment is compared with. */
  areaApprovalRate: number;
  notes: string | null;
}

export interface SegmentProfile {
  segment: number;
  label: string;
  /** Cuidar, Crecer, Convertir or Reactivar. */
  strategy: string;
  companyCount: number;
  firmCount: number;
  recencyMonthsMedian: number;
  frequencyMedian: number;
  typicalValueCop: number;
  /** Median smoothed approval rate, 0..1. */
  approvalRateMedian: number;
  dominantProgramType: string | null;
  dominantNode: string | null;
}

export interface CompanySegment {
  id: string;
  companyName: string;
  companyNit: string | null;
  segment: number;
  segmentLabel: string;
  recencyDays: number;
  /** Number of proposals. */
  frequency: number;
  /** log10 of the typical value in COP. */
  valueLog10: number;
  /** Smoothed approval rate, 0..1. */
  approvalRateSmoothed: number;
  approvalRateRaw: number | null;
  resolvedCount: number;
  dominantCompanyType: string | null;
  dominantProgramType: string | null;
  dominantNode: string | null;
  /** Share of model repetitions that kept the company in this segment, 0..1. */
  consistency: number;
  isFirm: boolean;
}

/** `run` is null (and both lists empty) while no run has been imported. */
export interface SegmentsResponse {
  run: SegmentRun | null;
  profiles: SegmentProfile[];
  companies: CompanySegment[];
}

export interface SegmentRunSummary extends SegmentRun {
  profileCount: number;
  companyCount: number;
}

export interface SegmentsParams {
  runId?: string;
  segment?: number;
  firmOnly?: boolean;
  search?: string;
}

export const segmentsApi = {
  /** The most recent run (or `runId`) with its profiles and companies. Administrators only. */
  get: (params: SegmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.runId) qs.set("runId", params.runId);
    if (params.segment !== undefined) qs.set("segment", String(params.segment));
    if (params.firmOnly !== undefined) qs.set("firmOnly", String(params.firmOnly));
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return apiRequest<SegmentsResponse>(`/segments${query ? `?${query}` : ""}`);
  },

  listRuns: () => apiRequest<SegmentRunSummary[]>("/segments/runs"),
};
