// One-page HTML field report download (printable to PDF from the browser).
export interface ReportData {
  title: string;
  fieldName: string;
  crop: string;
  location: string;
  generatedAt: string;
  stressNow: number;
  forecast: number;
  daysToCritical: number | null;
  riskLabel: string;
  advice: { text: string; why: string }[];
  simulatedNote: string;
}

export function downloadReport(d: ReportData) {
  const rows = d.advice.map((a) => `<li><strong>${a.text}</strong><br/><span style="color:#555">${a.why}</span></li>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${d.title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:32px auto;padding:0 16px;color:#111}
h1{font-size:22px}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 12px;text-align:left}
.badge{display:inline-block;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:2px 8px;font-size:12px}</style></head>
<body><h1>${d.title}</h1><p><span class="badge">${d.simulatedNote}</span></p>
<table><tr><th>Field</th><td>${d.fieldName}</td></tr><tr><th>Crop</th><td>${d.crop}</td></tr>
<tr><th>Location</th><td>${d.location}</td></tr><tr><th>Generated</th><td>${d.generatedAt}</td></tr>
<tr><th>Stress now</th><td>${Math.round(d.stressNow)} / 100 (${d.riskLabel})</td></tr>
<tr><th>Day-7 forecast</th><td>${Math.round(d.forecast)} / 100</td></tr>
<tr><th>Days until critical</th><td>${d.daysToCritical ?? "not reached in 7 days"}</td></tr></table>
<h2>Advice</h2><ul>${rows}</ul>
<script>window.onload=()=>window.print()</script></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `field-report-${d.fieldName.replace(/\s+/g, "-").toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const CSV_TEMPLATE = "date,soil_moisture,ndvi,rainfall\n2026-10-01,22,0.62,5\n2026-10-08,17,0.58,2\n";

export function parseObservationsCsv(text: string): { count: number } | { error: true } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { error: true };
  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const need = ["date", "soil_moisture", "ndvi", "rainfall"];
  if (!need.every((c) => header.includes(c))) return { error: true };
  const idx = need.map((c) => header.indexOf(c));
  let count = 0;
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    if (cols.length < need.length) return { error: true };
    const [sm, nd, rf] = [cols[idx[1]!], cols[idx[2]!], cols[idx[3]!]].map(Number);
    if ([sm, nd, rf].some(Number.isNaN)) return { error: true };
    count++;
  }
  return count > 0 ? { count } : { error: true };
}
