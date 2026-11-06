import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to the section named in the URL hash (e.g. navbar links to /#projects) once `ready` is true. */
export function useHashScroll(sectionIds: readonly string[], ready: boolean) {
  const { hash } = useLocation();
  const id = hash.slice(1);
  const known = sectionIds.includes(id);

  useEffect(() => {
    if (!ready || !known) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [id, known, ready]);
}
