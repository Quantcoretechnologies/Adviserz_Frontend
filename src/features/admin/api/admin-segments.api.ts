import { adminAuthedApi } from "@/lib/api";
import type {
  AcceptanceReport,
  AcceptanceReportParams,
  AdminSegment,
  BandInput,
  RiskRulesOverview,
  SaveRiskRulesResult,
} from "./admin-segments.types";

/**
 * Raw calls to the segment and risk-band endpoints. Components go through
 * the hooks in ../hooks.
 */
export const adminSegmentsApi = {
  listSegments: () =>
    adminAuthedApi
      .get<{ items: AdminSegment[] }>("/admin/segments")
      .then((data) => data.items),

  getRiskRules: (segmentId: string) =>
    adminAuthedApi.get<RiskRulesOverview>(
      `/admin/segments/${segmentId}/risk-rules`,
    ),

  /**
   * Save the whole band table as a new version. With `asPreview` nothing is
   * saved: the answer shows the changes and the effect on customers.
   */
  saveRiskRules: (segmentId: string, bands: BandInput[], asPreview: boolean) =>
    adminAuthedApi.put<SaveRiskRulesResult>(
      `/admin/segments/${segmentId}/risk-rules`,
      { bands },
      { query: { preview: asPreview } },
    ),

  acceptanceReport: (
    segmentId: string,
    version: number,
    params: AcceptanceReportParams,
  ) =>
    adminAuthedApi.get<AcceptanceReport>(
      `/admin/segments/${segmentId}/risk-rules/${version}/acceptances`,
      { query: { ...params } },
    ),
};

export const adminSegmentsKeys = {
  all: ["admin", "segments"] as const,
  list: ["admin", "segments", "list"] as const,
  riskRules: (segmentId: string) =>
    ["admin", "segments", "risk-rules", segmentId] as const,
  acceptances: (
    segmentId: string,
    version: number,
    params: AcceptanceReportParams,
  ) =>
    ["admin", "segments", "acceptances", segmentId, version, params] as const,
};
