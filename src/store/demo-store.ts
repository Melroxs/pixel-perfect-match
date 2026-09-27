/**
 * In-memory demo store.
 *
 * The prototype keeps all state in a single module-level snapshot exposed through
 * `useSyncExternalStore`. Mock services (src/services/mock) are the only things
 * that should mutate it, so replacing them with real API calls later does not
 * require touching components.
 */
import { useSyncExternalStore } from "react";
import { createInitialState } from "@/data/mock/seed";
import type { CrmState } from "@/types/crm";

let state: CrmState = createInitialState();
const listeners = new Set<() => void>();

export function getState(): CrmState {
  return state;
}

export function setState(updater: (current: CrmState) => CrmState): void {
  state = updater(state);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe a component to the whole demo state (reference is stable per update). */
export function useDemoState(): CrmState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function resetDemoState(): void {
  setState(() => createInitialState());
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter}`;
}
