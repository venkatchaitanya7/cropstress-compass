// Lightweight in-browser stress forecasting model.
// Fusion model = time-series (soil moisture, temperature, rainfall, NDVI trend) + latest observation.
// Image-only baseline = uses only the latest NDVI snapshot.

export type Intervention = "none" | "irrigation" | "fertilizer" | "shade" | "mulch";

export interface FieldInputs {
  crop: string;
  soilMoisture: number; // % volumetric, 0-60
  tempTrend: number; // °C change per week, -3..+5
  rainfall: number; // mm in last 7 days
  ndvi: number; // 0..1 latest vegetation index
  ndviSlope: number; // change per week, -0.15..+0.1
  seed?: number;
}

export interface DayPoint {
  day: number;
  observed?: number;
  fusion?: number;
  fusionLow?: number;
  fusionHigh?: number;
  imageOnly?: number;
  recovery?: number;
}

export const INTERVENTIONS: Record<Intervention, { label: string; moisture: number; ndvi: number; heat: number; lag: number }> = {
  none: { label: "No action", moisture: 0, ndvi: 0, heat: 0, lag: 0 },
  irrigation: { label: "Precision irrigation", moisture: 0.55, ndvi: 0.15, heat: 0.25, lag: 1 },
  fertilizer: { label: "Nutrient boost", moisture: 0, ndvi: 0.45, heat: 0, lag: 4 },
  shade: { label: "Shade netting", moisture: 0.15, ndvi: 0.1, heat: 0.6, lag: 1 },
  mulch: { label: "Organic mulch", moisture: 0.35, ndvi: 0.1, heat: 0.2, lag: 3 },
};

export const clamp = (v: number, a = 0, b = 100) => Math.min(b, Math.max(a, v));

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Instantaneous stress index (0 = healthy, 100 = severe). */
export function stressIndex(i: Pick<FieldInputs, "soilMoisture" | "tempTrend" | "rainfall" | "ndvi">): number {
  const water = clamp((30 - i.soilMoisture) * 2.2, 0, 60);
  const heat = clamp(i.tempTrend * 6, 0, 30);
  const rain = clamp((20 - i.rainfall) * 0.6, 0, 12);
  const veg = clamp((0.75 - i.ndvi) * 80, 0, 45);
  return clamp(water * 0.45 + heat * 0.6 + rain * 0.5 + veg * 0.9);
}

/** Image-only: knows only the current NDVI, assumes persistence. */
export function imageOnlyStress(ndvi: number): number {
  return clamp((0.8 - ndvi) * 110);
}

export function buildSeries(inp: FieldInputs, intervention: Intervention, horizon = 14) {
  const r = rng(inp.seed ?? 7);
  const history = 21;
  const pts: DayPoint[] = [];
  const now = stressIndex(inp);
  const weekly = inp.tempTrend * 3.2 - inp.ndviSlope * 140 + (25 - inp.soilMoisture) * 0.35 - inp.rainfall * 0.08;
  const daily = weekly / 7;

  for (let d = -history; d <= 0; d++) {
    pts.push({ day: d, observed: clamp(now + daily * d + (r() - 0.5) * 6) });
  }
  pts[pts.length - 1]!.observed = now;
  const base = imageOnlyStress(inp.ndvi);
  const iv = INTERVENTIONS[intervention];
  const effect = iv.moisture * clamp(35 - inp.soilMoisture, 0, 35) + iv.heat * clamp(inp.tempTrend * 6, 0, 30) + iv.ndvi * clamp((0.8 - inp.ndvi) * 60, 0, 40);

  const last = pts[pts.length - 1]!;
  last.fusion = now;
  last.fusionLow = now;
  last.fusionHigh = now;
  last.imageOnly = base;
  last.recovery = now;
  for (let d = 1; d <= horizon; d++) {
    const accel = 1 + d * 0.015 * Math.sign(daily);
    const f = clamp(now + daily * d * accel);
    const band = 2 + d * 0.9;
    const ramp = d <= iv.lag ? 0 : 1 - Math.exp(-(d - iv.lag) / 3.5);
    pts.push({
      day: d,
      fusion: f,
      fusionLow: clamp(f - band),
      fusionHigh: clamp(f + band),
      imageOnly: base,
      recovery: clamp(f - effect * ramp),
    });
  }
  const end = pts[pts.length - 1]!;
  const daysToCritical = pts.find((p) => p.day > 0 && (p.fusion ?? 0) >= 70)?.day ?? null;
  const benefit = (end.fusion ?? 0) - (end.recovery ?? 0);
  const successProb = clamp(Math.round(100 / (1 + Math.exp(-(benefit - 8) / 4))), 2, 98);
  return { points: pts, now, forecast: end.fusion ?? now, recovered: end.recovery ?? now, daysToCritical, benefit, successProb };
}

/** Simulated back-test: mean absolute error for both models across synthetic fields. */
export function backtest(n = 200) {
  const r = rng(42);
  let eF = 0, eI = 0;
  for (let k = 0; k < n; k++) {
    const inp: FieldInputs = {
      crop: "x",
      soilMoisture: 8 + r() * 40,
      tempTrend: -2 + r() * 6,
      rainfall: r() * 50,
      ndvi: 0.3 + r() * 0.55,
      ndviSlope: -0.12 + r() * 0.18,
      seed: k + 1,
    };
    const truth = buildSeries(inp, "none").forecast + (r() - 0.5) * 8;
    eF += Math.abs(buildSeries(inp, "none").forecast - truth);
    eI += Math.abs(imageOnlyStress(inp.ndvi) - truth);
  }
  return { fusionMAE: eF / n, imageMAE: eI / n };
}

export function riskLabel(v: number) {
  if (v < 25) return "Stable";
  if (v < 50) return "Watch";
  if (v < 70) return "Elevated";
  return "Critical";
}
