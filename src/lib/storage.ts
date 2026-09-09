import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSnapshot } from '../types';

/** Single, versioned key so migration stays trivial. */
export const STORAGE_KEY = 'aqua.snapshot.v1';

export async function loadSnapshot(): Promise<AppSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSnapshot(snapshot: AppSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Offline-first: a failed write is non-fatal, memory stays authoritative.
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Pretty-printed JSON used by "Export my data". */
export function serializeSnapshot(snapshot: AppSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
