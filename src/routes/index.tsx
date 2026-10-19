import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid,
} from "recharts";
import { Activity, CloudRain, Droplets, Leaf, Thermometer, Sprout, Cpu, Radar, TrendingDown, TrendingUp, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero-field.jpg";
import { backtest, buildSeries, INTERVENTIONS, riskLabel, type Intervention, type FieldInputs } from "@/lib/stress-model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroSentinel — AI Crop Stress Forecasting" },
      { name: "description", content: "Forecast crop stress 14 days ahead by fusing soil moisture, weather and crop history, and simulate recovery after intervention." },
      { property: "og:title", content: "AgroSentinel — AI Crop Stress Forecasting" },
      { property: "og:description", content: "Time-series AI that predicts how fast crop stress will worsen and whether your intervention will help." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CROPS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane"];
type Preset = Omit<FieldInputs, "crop" | "seed">;
const PRESETS = {
  "Drought onset": { soilMoisture: 11, tempTrend: 3, rainfall: 2, ndvi: 0.55, ndviSlope: -0.07 },
  "Heatwave": { soilMoisture: 24, tempTrend: 4.5, rainfall: 6, ndvi: 0.62, ndviSlope: -0.05 },
  "Healthy": { soilMoisture: 34, tempTrend: 0, rainfall: 28, ndvi: 0.78, ndviSlope: 0.02 },
} satisfies Record<string, Preset>;

function Slider({ icon: Icon, label, unit, value, min, max, step, onChange }: {
  icon: typeof Droplets; label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4 text-accent" />{label}</span>
        <span className="font-mono text-primary">{value}{unit}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 70, c = 2 * Math.PI * r, pct = value / 100;
  const tone = value >= 70 ? "var(--destructive)" : value >= 50 ? "var(--warning)" : value >= 25 ? "var(--accent)" : "var(--primary)";
  return (
    <div className="relative mx-auto h-48 w-48">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle cx="90" cy="90" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s, stroke .6s", filter: `drop-shadow(0 0 8px ${tone})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold" style={{ color: tone }}>{Math.round(value)}</span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{riskLabel(value)}</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Droplets; label: string; value: string; hint: string }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Index() {
  const [crop, setCrop] = useState("Wheat");
  const [f, setF] = useState<Preset>(PRESETS["Drought onset"]);
  const [iv, setIv] = useState<Intervention>("irrigation");
  const set = (k: keyof Preset) => (v: number) => setF((p) => ({ ...p, [k]: v }));

  const res = useMemo(() => buildSeries({ crop, ...f, seed: crop.length * 13 }, iv), [crop, f, iv]);
  const bt = useMemo(() => backtest(), []);
  const improvement = Math.round((1 - bt.fusionMAE / bt.imageMAE) * 100);
  const chartData = res.points.map((p) => ({ ...p, band: p.fusionLow !== undefined ? [p.fusionLow, p.fusionHigh] : undefined }));

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 glow">
              <Sprout className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-bold tracking-wider">AGRO<span className="text-primary">SENTINEL</span></span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-primary pulse-ring" /><span className="relative h-2 w-2 rounded-full bg-primary" /></span>
            MODEL ONLINE · v2.6
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={hero} alt="Holographic crop field with sensor overlays" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">// Predictive crop intelligence</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-black leading-tight md:text-6xl">
            See crop stress <span className="text-primary glow-text">before</span> it spreads.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            AgroSentinel fuses crop history, soil moisture and weather trends to forecast stress 14 days ahead — and shows whether your intervention will actually help.
          </p>
          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-4">
            {[["14d", "forecast horizon"], [`${improvement}%`, "lower error vs single image"], ["5", "interventions modelled"]].map(([v, l]) => (
              <div key={l} className="glass p-4">
                <div className="font-display text-2xl font-bold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Console */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Inputs */}
          <aside className="glass space-y-6 p-6">
            <div className="flex items-center gap-2 font-display text-sm tracking-widest"><Radar className="h-4 w-4 text-primary" /> FIELD SENSORS</div>
            <div className="flex flex-wrap gap-2">
              {CROPS.map((c) => (
                <button key={c} onClick={() => setCrop(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${crop === c ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
              ))}
            </div>
            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scenario presets</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(PRESETS).map((k) => (
                  <button key={k} onClick={() => setF(PRESETS[k as keyof typeof PRESETS])} className="rounded-md border border-border bg-secondary/50 px-2 py-2 text-[11px] text-foreground transition hover:border-accent hover:text-accent">{k}</button>
                ))}
              </div>
            </div>
            <Slider icon={Droplets} label="Soil moisture" unit="%" value={f.soilMoisture} min={5} max={50} step={1} onChange={set("soilMoisture")} />
            <Slider icon={Thermometer} label="Temp trend / week" unit="°C" value={f.tempTrend} min={-2} max={5} step={0.5} onChange={set("tempTrend")} />
            <Slider icon={CloudRain} label="Rainfall, last 7d" unit="mm" value={f.rainfall} min={0} max={60} step={1} onChange={set("rainfall")} />
            <Slider icon={Leaf} label="Crop vigor (NDVI)" unit="" value={f.ndvi} min={0.2} max={0.9} step={0.01} onChange={set("ndvi")} />
            <Slider icon={Activity} label="Vigor trend / week" unit="" value={f.ndviSlope} min={-0.15} max={0.1} step={0.01} onChange={set("ndviSlope")} />
          </aside>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="glass scanline p-6 text-center">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stress index · now</div>
                <Gauge value={res.now} />
                <div className="text-xs text-muted-foreground">{crop} field · 0 healthy → 100 severe</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Stat icon={res.forecast > res.now ? TrendingUp : TrendingDown} label="Day 14 forecast" value={`${Math.round(res.forecast)}`} hint={`${riskLabel(res.forecast)} if nothing changes`} />
                <Stat icon={Activity} label="Time to critical" value={res.daysToCritical ? `${res.daysToCritical} d` : "—"} hint={res.daysToCritical ? "until index crosses 70" : "not reached in 14 days"} />
                <Stat icon={ShieldCheck} label="Intervention success" value={`${res.successProb}%`} hint={`${INTERVENTIONS[iv].label}`} />
                <Stat icon={TrendingDown} label="Stress averted" value={`${Math.max(0, Math.round(res.benefit))}`} hint="index points by day 14" />
              </div>
            </div>

            <div className="glass p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-display text-sm tracking-widest">STRESS TRAJECTORY</div>
                  <div className="text-xs text-muted-foreground">21 days observed · 14 days forecast</div>
                </div>
                <div className="flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><i className="h-0.5 w-4 bg-foreground" />Observed</span>
                  <span className="flex items-center gap-1"><i className="h-0.5 w-4 bg-destructive" />Fusion forecast</span>
                  <span className="flex items-center gap-1"><i className="h-0.5 w-4 bg-primary" />With intervention</span>
                  <span className="flex items-center gap-1"><i className="h-0.5 w-4 border-t border-dashed border-muted-foreground" />Single image</span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(d) => (d === 0 ? "Today" : d > 0 ? `+${d}` : `${d}`)} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                      formatter={(v) => (Array.isArray(v) ? `${Number(v[0]).toFixed(0)}–${Number(v[1]).toFixed(0)}` : Number(v).toFixed(1))} />
                    <ReferenceLine y={70} stroke="var(--destructive)" strokeDasharray="4 4" label={{ value: "CRITICAL", fill: "var(--destructive)", fontSize: 10, position: "insideTopLeft" }} />
                    <ReferenceLine x={0} stroke="var(--accent)" />
                    <Area dataKey="band" name="Confidence" fill="var(--destructive)" fillOpacity={0.12} stroke="none" />
                    <Line dataKey="observed" name="Observed" stroke="var(--foreground)" dot={false} strokeWidth={2} />
                    <Line dataKey="fusion" name="Fusion forecast" stroke="var(--destructive)" dot={false} strokeWidth={2} />
                    <Line dataKey="recovery" name="With intervention" stroke="var(--primary)" dot={false} strokeWidth={3} style={{ filter: "drop-shadow(0 0 6px var(--primary))" }} />
                    <Line dataKey="imageOnly" name="Single image" stroke="var(--muted-foreground)" strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass p-6">
              <div className="mb-4 font-display text-sm tracking-widest">SIMULATE INTERVENTION</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {(Object.keys(INTERVENTIONS) as Intervention[]).map((k) => (
                  <button key={k} onClick={() => setIv(k)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${iv === k ? "border-primary bg-primary/10 text-primary glow" : "border-border text-muted-foreground hover:border-accent hover:text-foreground"}`}>
                    <div className="font-medium">{INTERVENTIONS[k].label}</div>
                    <div className="mt-1 font-mono text-[10px] opacity-70">{k === "none" ? "baseline" : `effect after ~${INTERVENTIONS[k].lag}d`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research */}
      <section className="border-t border-border grid-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">// Research question</p>
            <h2 className="mt-4 font-display text-3xl font-bold">Does time-series fusion beat a single image?</h2>
            <p className="mt-4 text-muted-foreground">
              We back-tested both approaches across 200 simulated fields. The single-image model only sees today's crop vigor and assumes nothing changes. The fusion model reads 21 days of soil, weather and crop history.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground"><Cpu className="h-4 w-4 text-primary" />Lower error = more reliable 14-day forecast.</div>
          </div>
          <div className="glass space-y-6 p-8">
            {[["Time-series fusion", bt.fusionMAE, "bg-primary"], ["Single image", bt.imageMAE, "bg-muted-foreground"]].map(([l, v, c]) => (
              <div key={l as string}>
                <div className="mb-2 flex justify-between text-sm"><span>{l as string}</span><span className="font-mono text-primary">avg error {(v as number).toFixed(1)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(100, ((v as number) / bt.imageMAE) * 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
              <span className="font-display text-2xl font-bold text-primary">{improvement}%</span>
              <span className="ml-2 text-muted-foreground">less forecast error with fusion</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        AGROSENTINEL · predictive crop intelligence · simulated data for demonstration
      </footer>
    </main>
  );
}
