// Rule-based, plain-language advice. Each item has a one-line "why".
import type { FieldInputs } from "./stress-model";

export interface AdviceItem {
  key: string; // i18n key for the advice
  whyKey: string; // i18n key for the reason
  urgent: boolean;
}

export function getAdvice(f: Pick<FieldInputs, "soilMoisture" | "tempTrend" | "rainfall" | "ndvi" | "ndviSlope">, risk: number): AdviceItem[] {
  const out: AdviceItem[] = [];
  if (f.soilMoisture < 18 && f.rainfall < 10) out.push({ key: "advIrrigate", whyKey: "advIrrigateWhy", urgent: true });
  if (f.ndviSlope < -0.03 && f.soilMoisture >= 18) out.push({ key: "advPest", whyKey: "advPestWhy", urgent: risk >= 50 });
  if (f.rainfall >= 25) out.push({ key: "advDelayFert", whyKey: "advDelayFertWhy", urgent: false });
  if (f.soilMoisture < 25 && f.tempTrend > 1.5) out.push({ key: "advMulch", whyKey: "advMulchWhy", urgent: false });
  if (f.tempTrend >= 3) out.push({ key: "advShade", whyKey: "advShadeWhy", urgent: risk >= 50 });
  if (out.length === 0) out.push({ key: "advMonitor", whyKey: "advMonitorWhy", urgent: false });
  return out.slice(0, 3);
}
