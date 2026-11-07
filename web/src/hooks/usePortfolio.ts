import { useCallback, useEffect, useState } from 'react';
import { getExperience, type Experience } from '../api/experience';
import { getProfile, type Profile } from '../api/profile';
import { getProjects, type Project } from '../api/projectstate';
import { getTestimonials, type Testimonial } from '../api/testimonials';

/** Loads the public profile and project list together, with a retry for when the API is unreachable. */
export function usePortfolio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPortfolio = useCallback(
    () =>
      // Experience and testimonials are optional extras: if they fail, show the rest of the page without them.
      Promise.all([
        getProfile(),
        getProjects(),
        getExperience().catch(() => []),
        getTestimonials().catch(() => []),
      ])
        .then(([prof, projs, exp, quotes]) => {
          setProfile(prof);
          setProjects(projs);
          setExperience(exp);
          setTestimonials(quotes);
          setError(false);
        })
        .catch((err) => {
          console.error('Failed to load portfolio:', err);
          setError(true);
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const retry = () => {
    setLoading(true);
    setError(false);
    fetchPortfolio();
  };

  return { profile, projects, experience, testimonials, loading, error, retry };
}
