import { useEffect } from 'react';
import type { Profile } from '../api/profile';
import { setMeta, summarize } from '../seo';

/** Keeps title/description in sync with the live profile (the static build-time tags are the fallback). */
export function useProfileMeta(profile: Profile | null) {
  useEffect(() => {
    if (!profile) return;
    const title = `${profile.name}${profile.headline ? ` | ${profile.headline}` : ''}`;
    document.title = title;
    setMeta('property', 'og:title', title);
    const description = profile.bio || profile.headline;
    if (description) {
      setMeta('name', 'description', summarize(description));
      setMeta('property', 'og:description', summarize(description));
    }
  }, [profile]);
}
