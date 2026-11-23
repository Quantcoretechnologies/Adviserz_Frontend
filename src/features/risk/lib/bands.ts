import { ErrorCode, isApiError } from "@/lib/api";
import { formatInr, trimDecimal } from "@/lib/utils/format";
import type {
  AcknowledgementLevel,
  Acknowledgement,
  Disclaimer,
  RiskBand,
  RiskBasis,
  RiskLevel,
  RiskRules,
} from "../api/risk.types";

/**
 * The band rules, mirrored from the API so the screens can guide the user
 * as they type. The API checks everything again on save and is the
 * authority; these are for instant feedback only.
 */

/** The phrase the strict disclaimer asks the user to type. */
export const CONFIRMATION_PHRASE = "I ACCEPT THE RISK";

/** Case, surrounding spaces and repeated spaces do not matter (same rule as the API). */
export function matchesConfirmationPhrase(input: string): boolean {
  return (
    input.trim().replace(/\s+/g, " ").toUpperCase() === CONFIRMATION_PHRASE
  );
}

/** The band that contains `capital`, or null when it is below the first band. */
export function findBand(rules: RiskRules, capital: string): RiskBand | null {
  const value = Number(capital);
  if (!Number.isFinite(value)) return null;
  let match: RiskBand | null = null;
  for (const band of rules.bands) {
    if (Number(band.capitalFrom) <= value) match = band;
    else break;
  }
  return match;
}

export function classifyRisk(
  band: RiskBand,
  riskPercent: string,
  ceilingPercent = "100",
): RiskLevel {
  const value = Number(riskPercent);
  if (value < Number(band.minRiskPercent)) return "below_minimum";
  if (value > Number(ceilingPercent)) return "above_ceiling";
  if (value > Number(band.maxRiskPercent)) return "above_maximum";
  if (value > Number(band.suggestedRiskPercent)) return "above_suggested";
  return "within";
}

export function acknowledgementFor(
  level: RiskLevel,
): AcknowledgementLevel | null {
  return level === "above_suggested" || level === "above_maximum"
    ? level
    : null;
}

/** Money at risk, to the paisa: capital x risk% / 100. */
export function riskAmount(capital: string, riskPercent: string): string {
  const amount = (Number(capital) * Number(riskPercent)) / 100;
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export function riskAmountPeriod(riskBasis: RiskBasis): string {
  return riskBasis === "daily_loss" ? "per day" : "of capital";
}

export const percent = (value: string): string => `${trimDecimal(value)}%`;

/** "₹10,000 – ₹19,999.99" or "₹5,00,00,000 and above". */
export function bandRangeLabel(band: RiskBand): string {
  return band.capitalTo
    ? `${formatInr(band.capitalFrom)} – ${formatInr(band.capitalTo)}`
    : `${formatInr(band.capitalFrom)} and above`;
}

/** The acknowledgement to send for a disclaimer the user accepted. */
export function acknowledgementOf(
  disclaimer: Disclaimer,
  typedConfirmation?: string,
): Acknowledgement {
  return {
    level: disclaimer.level,
    ruleSetId: disclaimer.ruleSetId,
    policyDocumentId: disclaimer.policyDocumentId,
    statementSha256: disclaimer.statementSha256,
    ...(disclaimer.level === "above_maximum" && typedConfirmation
      ? { typedConfirmation }
      : {}),
  };
}

/**
 * The disclaimers a rejected save asks for (RISK_ACKNOWLEDGEMENT_REQUIRED),
 * keyed by segment. Empty for any other error.
 */
export function disclaimersFromError(
  error: unknown,
): { segmentId: string; disclaimer: Disclaimer }[] {
  if (
    !isApiError(error) ||
    error.code !== ErrorCode.RISK_ACKNOWLEDGEMENT_REQUIRED ||
    !Array.isArray(error.details)
  ) {
    return [];
  }
  return (error.details as { segmentId?: string; disclaimer?: Disclaimer }[])
    .filter(
      (detail): detail is { segmentId: string; disclaimer: Disclaimer } =>
        typeof detail.segmentId === "string" && detail.disclaimer !== undefined,
    )
    .map(({ segmentId, disclaimer }) => ({ segmentId, disclaimer }));
}
