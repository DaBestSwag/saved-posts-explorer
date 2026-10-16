import { useSyncExternalStore } from 'react';

export type Layout = 'phone' | 'tablet' | 'desktop';

// Keep in sync with the breakpoints in styles.css.
const PHONE = '(max-width: 699px)';
const DESKTOP = '(min-width: 1100px)';

const subscribe = (cb: () => void) => {
  const lists = [PHONE, DESKTOP].map((q) => window.matchMedia(q));
  lists.forEach((m) => m.addEventListener('change', cb));
  return () => lists.forEach((m) => m.removeEventListener('change', cb));
};
const get = (): Layout => (window.matchMedia(PHONE).matches ? 'phone' : window.matchMedia(DESKTOP).matches ? 'desktop' : 'tablet');

export const useLayout = () => useSyncExternalStore(subscribe, get);
