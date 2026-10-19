// Multi-field manager + recovery log, persisted in localStorage.
import type { FieldInputs } from "./stress-model";

export type LogAction = "irrigation" | "fertilizer" | "pesticide" | "none";

export interface ActionLog {
  action: LogAction;
  date: string; // ISO date
  stressBefore: number;
  stressAfter: number; // observed by the farmer
}

export interface Field {
  id: string;
  name: string;
  crop: string;
  area: number; // acres
  location: string;
  inputs: Omit<FieldInputs, "crop" | "seed">;
  logs: ActionLog[];
}

const KEY = "agrosentinel-fields";

export function loadFields(): Field[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Field[]) : [];
  } catch {
    return [];
  }
}

export function saveFields(fields: Field[]) {
  window.localStorage.setItem(KEY, JSON.stringify(fields));
}

export function newField(name: string, crop: string, area: number, location: string, inputs: Field["inputs"]): Field {
  return { id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name, crop, area, location, inputs, logs: [] };
}

/** Verdict comparing observed stress after an action vs the no-action forecast. */
export function verdict(observedAfter: number, noActionForecast: number): "improving" | "noChange" | "gettingWorse" {
  const diff = observedAfter - noActionForecast;
  if (diff <= -5) return "improving";
  if (diff >= 5) return "gettingWorse";
  return "noChange";
}
