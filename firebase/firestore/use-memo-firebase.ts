
'use client';

import { useMemo, useRef } from 'react';

/**
 * A custom hook to stabilize Firebase references or queries.
 * It uses a ref to keep track of dependencies and only returns a new value 
 * if the dependencies have actually changed.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T | null>(null);
  const prevDeps = useRef<any[]>([]);

  const changed = !prevDeps.current || deps.length !== prevDeps.current.length || deps.some((dep, i) => dep !== prevDeps.current[i]);

  if (changed) {
    ref.current = factory();
    prevDeps.current = deps;
  }

  return ref.current as T;
}
