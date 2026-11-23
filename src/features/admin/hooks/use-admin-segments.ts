import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { adminSegmentsApi, adminSegmentsKeys } from "../api/admin-segments.api";
import type {
  AcceptanceReport,
  AcceptanceReportParams,
  AdminSegment,
  BandInput,
  RiskRulesOverview,
  SaveRiskRulesResult,
} from "../api/admin-segments.types";

export function useAdminSegments(enabled = true) {
  return useQuery<AdminSegment[], ApiError>({
    queryKey: adminSegmentsKeys.list,
    queryFn: adminSegmentsApi.listSegments,
    enabled,
  });
}

/** A segment's bands in force and every earlier version. */
export function useRiskRules(segmentId: string | null) {
  return useQuery<RiskRulesOverview, ApiError>({
    queryKey: adminSegmentsKeys.riskRules(segmentId ?? ""),
    queryFn: () => adminSegmentsApi.getRiskRules(segmentId ?? ""),
    enabled: segmentId !== null,
  });
}

interface SaveVariables {
  segmentId: string;
  bands: BandInput[];
  asPreview: boolean;
}

/**
 * Preview or save a band table. A real save refreshes the segments, their
 * versions and the acceptance reports.
 */
export function useSaveRiskRules() {
  const queryClient = useQueryClient();
  return useMutation<SaveRiskRulesResult, ApiError, SaveVariables>({
    mutationFn: ({ segmentId, bands, asPreview }) =>
      adminSegmentsApi.saveRiskRules(segmentId, bands, asPreview),
    onSuccess: (result) => {
      if (result.preview) return;
      void queryClient.invalidateQueries({ queryKey: adminSegmentsKeys.all });
    },
  });
}

/** Who accepted a version that notified customers. */
export function useAcceptanceReport(
  segmentId: string,
  version: number | null,
  params: AcceptanceReportParams,
) {
  return useQuery<AcceptanceReport, ApiError>({
    queryKey: adminSegmentsKeys.acceptances(segmentId, version ?? 0, params),
    queryFn: () =>
      adminSegmentsApi.acceptanceReport(segmentId, version ?? 0, params),
    enabled: version !== null,
    placeholderData: keepPreviousData,
  });
}
