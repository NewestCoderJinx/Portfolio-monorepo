import { useEffect } from 'react';
import type { Profile } from '../api/profile';
import type { Project } from '../api/projectstate';
import { applyPageMeta } from '../seo';

/**
 * Keeps the title, description and preview tags in sync with what's on screen: the profile, or the open
 * case study. The static build-time tags are the fallback for crawlers that don't run JavaScript.
 */
export function useProfileMeta(profile: Profile | null, project: Project | null = null) {
  useEffect(() => {
    if (!profile) return;
    const home = `${window.location.origin}${window.location.pathname}`;
    if (project) {
      applyPageMeta({
        title: `${project.title} | ${profile.name}`,
        description: project.description || project.problem || profile.headline,
        image: project.imageUrl || profile.avatarUrl,
        url: `${home}#project-${project.id}`,
      });
    } else {
      applyPageMeta({
        title: `${profile.name}${profile.headline ? ` | ${profile.headline}` : ''}`,
        description: profile.bio || profile.headline,
        image: profile.avatarUrl,
        url: home,
      });
    }
  }, [profile, project]);
}
