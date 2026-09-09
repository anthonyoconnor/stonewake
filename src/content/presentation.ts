/** Session preferences only: a reload returns to the browser/system defaults. */
export const presentation = { motion: 'system' as 'system' | 'reduce' | 'full', edgeScrolling: true };
export const reducedMotion = () => presentation.motion === 'reduce' ||
  (presentation.motion === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
