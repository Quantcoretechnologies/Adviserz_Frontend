import type { RiskBand, RiskRules } from "@/features/risk/api/risk.types";
import type { Pagination } from "./admin-access.types";

/** Shapes of the admin segment and risk-band endpoints. Decimals are strings. */

export interface AdminSegment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  riskBasis: "total_capital" | "daily_loss";
  minCapital: string | null;
  currency: string;
  isActive: boolean;
  displayOrder: number;
  suggestedMode: "midpoint" | "manual";
  riskRules: RiskRules | null;
}

export type BandValues = Pick<
  RiskBand,
  "minRiskPercent" | "suggestedRiskPercent" | "maxRiskPercent"
>;

export interface BandChange {
  change: "added" | "removed" | "changed";
  capitalFrom: string;
  before: BandValues | null;
  after: BandValues | null;
}

/** What a version changed compared with the one before it. */
export interface ChangeSummary {
  fromVersion: number | null;
  minCapital: { before: string | null; after: string };
  suggestedMode: { before: string | null; after: string };
  bands: BandChange[];
}

export interface RiskRuleVersion {
  id: string;
  version: number;
  suggestedMode: "midpoint" | "manual";
  /** migration / seed: set up by the system; admin: saved in the console. */
  source: "migration" | "seed" | "admin";
  /** True when customers holding the segment were asked to accept it. */
  notifyUsers: boolean;
  changeSummary: ChangeSummary | null;
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
}

export interface RiskRulesOverview {
  segment: {
    id: string;
    code: string;
    name: string;
    riskBasis: AdminSegment["riskBasis"];
    currency: string;
  };
  current: RiskRules | null;
  /** Newest first. */
  versions: RiskRuleVersion[];
}

/** One row of the band table as sent to the API. */
export interface BandInput {
  capitalFrom: string;
  minRiskPercent: string;
  maxRiskPercent: string;
  /** Only for segments whose suggested value is typed (manual). */
  suggestedRiskPercent?: string;
}

/** What a band table means for the customers holding the segment now. */
export interface RiskRulesImpact {
  customers: number;
  /** Customers who will get a notice: all but those who already have exactly these limits. */
  notified: number;
  ok: number;
  needsCautionAck: number;
  needsStrictAck: number;
  mustChange: number;
}

export interface SaveRiskRulesResult {
  preview: boolean;
  ruleSet: RiskRules;
  changes: ChangeSummary;
  impact: RiskRulesImpact;
}

export type AcceptanceStatus = "accepted" | "pending" | "up_to_date";

export interface AcceptanceReport {
  version: number;
  effectiveFrom: string;
  summary: {
    accepted: number;
    pending: number;
    upToDate: number;
    total: number;
  };
  items: {
    userId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: AcceptanceStatus;
    acceptedAt: string | null;
  }[];
  pagination: Pagination;
}

export interface AcceptanceReportParams {
  status?: AcceptanceStatus;
  page: number;
  pageSize: number;
}
