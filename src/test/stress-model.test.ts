import { describe, it, expect } from "vitest";
import { buildSeries, backtest, riskLabel } from "@/lib/stress-model";

const dry = { crop: "Wheat", soilMoisture: 10, tempTrend: 3, rainfall: 2, ndvi: 0.5, ndviSlope: -0.08 };

describe("stress model", () => {
  it("dry, warming field gets worse over the forecast", () => {
    const s = buildSeries(dry, "none");
    expect(s.forecast).toBeGreaterThan(s.now);
  });
  it("irrigation lowers projected stress on a dry field", () => {
    const s = buildSeries(dry, "irrigation");
    expect(s.recovered).toBeLessThan(s.forecast);
  });
  it("fusion beats image-only in the back-test", () => {
    const b = backtest();
    expect(b.fusionMAE).toBeLessThan(b.imageMAE);
  });
  it("70+ is critical", () => {
    expect(riskLabel(70)).toBe("Critical");
  });
});
