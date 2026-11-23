import { authedApi } from "@/lib/api";
import type {
  AcceptRiskNoticeRequest,
  AssessmentItem,
  AssessmentRequestItem,
  RiskNoticeResponse,
  RiskSegment,
} from "./risk.types";

/** Raw calls to the risk-limit endpoints of the signed-in user. */
export const riskApi = {
  /** Active segments with their bands in force. */
  segments: () => authedApi.get<{ items: RiskSegment[] }>("/segments"),

  /** Check values against the bands in force; returns any disclaimer to show. Saves nothing. */
  assess: (allocations: AssessmentRequestItem[]) =>
    authedApi.post<{ items: AssessmentItem[] }>("/users/me/risk-assessment", {
      allocations,
    }),

  getNotice: () => authedApi.get<RiskNoticeResponse>("/users/me/risk-notice"),

  acceptNotice: (body: AcceptRiskNoticeRequest) =>
    authedApi.post<{ accepted: boolean }>("/users/me/risk-notice/accept", body),
};

export const riskKeys = {
  notice: ["risk", "notice"] as const,
  segments: ["risk", "segments"] as const,
};
