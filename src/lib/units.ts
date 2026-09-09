import { UnitSystem } from '../types';

export const ML_PER_FL_OZ = 29.5735;
export const KG_PER_LB = 0.45359237;

/** Convert millilitres to the user's display unit. */
export function fromMl(ml: number, unit: UnitSystem): number {
  return unit === 'metric' ? ml : ml / ML_PER_FL_OZ;
}

/** Convert the user's display unit back to millilitres. */
export function toMl(value: number, unit: UnitSystem): number {
  return unit === 'metric' ? value : value * ML_PER_FL_OZ;
}

export function unitLabel(unit: UnitSystem): string {
  return unit === 'metric' ? 'ml' : 'fl oz';
}

export function weightUnit(unit: UnitSystem): string {
  return unit === 'metric' ? 'kg' : 'lb';
}

export function fromKg(kg: number, unit: UnitSystem): number {
  return unit === 'metric' ? kg : kg / KG_PER_LB;
}

export function toKg(value: number, unit: UnitSystem): number {
  return unit === 'metric' ? value : value * KG_PER_LB;
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Render a volume for display. Imperial gets one decimal when it would
 * otherwise read as an awkward integer (e.g. `8.5 fl oz` vs `8 fl oz`).
 */
export function formatVolume(ml: number, unit: UnitSystem, opts: { decimals?: number } = {}): string {
  const value = fromMl(ml, unit);
  if (unit === 'metric') {
    const rounded = Math.round(value);
    return opts.decimals != null ? value.toFixed(opts.decimals) : `${rounded}`;
  }
  if (opts.decimals != null) return value.toFixed(opts.decimals);
  const rounded = Math.round(value);
  // Round to the nearest integer within a small tolerance so the common vessel
  // sizes read cleanly (500 ml -> "17 fl oz", not "16.9"). The canonical
  // millilitre value stored on device is never affected by this rounding.
  if (Math.abs(value - rounded) < 0.15) return `${rounded}`;
  return value.toFixed(1);
}

/** Volume + unit, e.g. `1,850 ml` / `62.5 fl oz`. */
export function formatVolumeWithUnit(ml: number, unit: UnitSystem, opts: { decimals?: number } = {}): string {
  const n = formatVolume(ml, unit, opts);
  return `${groupDigits(n)} ${unitLabel(unit)}`;
}

/** Adds thousands separators to a numeric string. */
export function groupDigits(value: string): string {
  const negative = value.startsWith('-');
  const clean = negative ? value.slice(1) : value;
  const [int, dec] = clean.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const out = dec ? `${grouped}.${dec}` : grouped;
  return negative ? `-${out}` : out;
}

/** Litres helper used for the total-volume achievement copy. */
export function formatLitres(ml: number): string {
  const l = ml / 1000;
  if (l < 1) return `${Math.round(ml)} ml`;
  if (l < 100) return `${l.toFixed(1)} L`;
  return `${Math.round(l)} L`;
}
