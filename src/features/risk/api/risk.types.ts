/** Shapes of the risk-limit endpoints. Decimals are strings with a fixed scale. */

export type RiskBasis = "total_capital" | "daily_loss";

/** A capital band: applies from `capitalFrom` up to `capitalTo` (null = no upper end). */
export interface RiskBand {
  capitalFrom: string;
  capitalTo: string | null;
  minRiskPercent: string;
  suggestedRiskPercent: string;
  maxRiskPercent: string;
}

/** A segment's bands in force. */
export interface RiskRules {
  ruleSetId: string;
  version: number;
  suggestedMode: "midpoint" | "manual";
  minCapital: string;
  /** No risk may go above this (100%). */
  ceilingPercent: string;
  bands: RiskBand[];
}

/** A segment with the bands in force (from GET /segments). */
export interface RiskSegment {
  id: string;
  code: string;
  name: string;
  riskBasis: RiskBasis;
  currency: string;
  minCapital: string | null;
  riskRules: RiskRules | null;
}

export type AcknowledgementLevel = "above_suggested" | "above_maximum";

export type RiskLevel =
  | "below_minimum"
  | "within"
  | "above_suggested"
  | "above_maximum"
  | "above_ceiling";

/** A disclaimer filled in with the user's own numbers, ready to show. */
export interface Disclaimer {
  level: AcknowledgementLevel;
  ruleSetId: string;
  ruleSetVersion: number;
  policyDocumentId: string;
  policyVersion: number;
  title: string;
  statement: string;
  statementSha256: string;
  /** Set for the strict disclaimer: the phrase the user must type. */
  confirmationPhrase: string | null;
}

/** What is sent back once the user accepts a disclaimer. */
export interface Acknowledgement {
  level: AcknowledgementLevel;
  ruleSetId: string;
  policyDocumentId: string;
  statementSha256: string;
  typedConfirmation?: string;
}

export interface AssessmentRequestItem {
  segmentId: string;
  capital: string;
  riskPercent: string;
}

export interface AssessmentItem {
  segmentId: string;
  allowed: boolean;
  violation: { path: string; message: string; reason?: string } | null;
  assessment: {
    capital: string;
    riskPercent: string;
    riskAmount: string;
    level: RiskLevel;
    acknowledgementRequired: AcknowledgementLevel | null;
    band: RiskBand;
  } | null;
  disclaimer: Disclaimer | null;
}

export type RiskNoticeStatus =
  "ok" | "needs_caution_ack" | "needs_strict_ack" | "must_change";

type BandValues = Pick<
  RiskBand,
  "minRiskPercent" | "suggestedRiskPercent" | "maxRiskPercent"
>;

export interface RiskNoticeSegment {
  segmentId: string;
  code: string;
  name: string;
  riskBasis: RiskBasis;
  currency: string;
  fromRuleSet: { id: string; version: number } | null;
  toRuleSet: { id: string; version: number };
  minCapital: { before: string | null; after: string };
  bandChanges: {
    change: "added" | "removed" | "changed";
    capitalFrom: string;
    before: BandValues | null;
    after: BandValues | null;
  }[];
  yourValues: {
    capital: string;
    riskPercent: string | null;
    riskAmount: string | null;
  };
  yourBand: { before: RiskBand | null; after: RiskBand | null };
  status: RiskNoticeStatus;
  reason: "capital_below_minimum" | "risk_below_minimum" | null;
}

export interface RiskNotice {
  title: string;
  statement: string;
  segments: RiskNoticeSegment[];
  noticeSha256: string;
  policyDocumentId: string;
  riskProfileVersion: number;
  /** One per segment that needs a disclaimer accepted with the notice. */
  disclaimers: (Disclaimer & { segmentId: string })[];
}

export interface RiskNoticeResponse {
  required: boolean;
  notice: RiskNotice | null;
}

export interface AcceptRiskNoticeRequest {
  noticeSha256: string;
  policyDocumentId: string;
  segments: {
    segmentId: string;
    capital?: string;
    riskPercent?: string;
    acknowledgement?: Acknowledgement;
  }[];
}
