import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/api/auth.api";
import type { ApiError } from "@/lib/api";
import { riskApi, riskKeys } from "../api/risk.api";
import type {
  AcceptRiskNoticeRequest,
  AssessmentItem,
  AssessmentRequestItem,
  RiskNoticeResponse,
  RiskSegment,
} from "../api/risk.types";

/** Check values (and fetch any disclaimer they need) without saving. */
export function useAssessRisk() {
  return useMutation<
    { items: AssessmentItem[] },
    ApiError,
    AssessmentRequestItem[]
  >({
    mutationFn: riskApi.assess,
  });
}

/** Active segments with the bands in force. */
export function useRiskSegments() {
  return useQuery<{ items: RiskSegment[] }, ApiError>({
    queryKey: riskKeys.segments,
    queryFn: riskApi.segments,
    staleTime: 0,
  });
}

/** The pending risk-limit change notice, if any. */
export function useRiskNotice() {
  return useQuery<RiskNoticeResponse, ApiError>({
    queryKey: riskKeys.notice,
    queryFn: riskApi.getNotice,
    // The notice must reflect the limits in force right now.
    staleTime: 0,
  });
}

export function useAcceptRiskNotice() {
  const queryClient = useQueryClient();
  return useMutation<{ accepted: boolean }, ApiError, AcceptRiskNoticeRequest>({
    mutationFn: riskApi.acceptNotice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: riskKeys.notice });
      void queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
}
