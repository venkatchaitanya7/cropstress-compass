// Open-Meteo fetch (free, no API key) with an offline sample fallback.
export interface WeatherResult {
  rainfall7d: number; // mm, last 7 days
  tempTrend: number; // °C/week, mean of last 3 days minus mean of prior 4
  live: boolean; // false => bundled offline sample was used
}

// Bundled sample (labelled "Offline sample data" in the UI when used).
const SAMPLE: WeatherResult = { rainfall7d: 4.2, tempTrend: 2.8, live: false };

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResult> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,precipitation_sum&past_days=7&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as {
      daily?: { temperature_2m_max?: number[]; precipitation_sum?: number[] };
    };
    const temps = j.daily?.temperature_2m_max ?? [];
    const rain = j.daily?.precipitation_sum ?? [];
    if (temps.length < 7) throw new Error("incomplete data");
    const last7 = temps.slice(0, 7);
    const rainfall7d = rain.slice(0, 7).reduce((a, b) => a + (b ?? 0), 0);
    const recent = (last7[4]! + last7[5]! + last7[6]!) / 3;
    const prior = (last7[0]! + last7[1]! + last7[2]! + last7[3]!) / 4;
    return {
      rainfall7d: Math.round(rainfall7d * 10) / 10,
      tempTrend: Math.round((recent - prior) * 10) / 10,
      live: true,
    };
  } catch {
    return SAMPLE;
  }
}
