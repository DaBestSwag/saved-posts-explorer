import { useState } from 'react';

/** useState persisted to localStorage; every access is guarded (private mode etc.). */
export function useStored<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const set = (v: T) => {
    setVal(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  };
  return [val, set];
}
