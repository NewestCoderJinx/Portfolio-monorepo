import { useEffect } from 'react';
import type { Profile } from '../api/profile';
import { formatUrl } from '../api/projectstate';
import type { Skill } from '../api/skills';
import { setJsonLd } from '../seo';

const ID = 'ld-person';

/**
 * Describes the portfolio owner as a schema.org Person, so search engines can tie the page to their
 * name, role and profiles elsewhere. Email is left out to keep it away from scrapers.
 */
export function useStructuredData(profile: Profile | null, skills: Skill[]) {
  useEffect(() => {
    if (!profile) return;
    const url = `${window.location.origin}/`;
    const absolute = (u?: string) => (u ? new URL(u, window.location.href).href : undefined);
    const sameAs = [profile.githubUrl, profile.linkedinUrl, profile.websiteUrl].map((u) => formatUrl(u)).filter(Boolean);

    setJsonLd(ID, {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      url,
      jobTitle: profile.headline || undefined,
      description: profile.bio || undefined,
      image: absolute(profile.avatarUrl),
      address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
      knowsAbout: skills.length ? skills.map((s) => s.name) : undefined,
    });
    return () => setJsonLd(ID, null);
  }, [profile, skills]);
}
