import { useCallback, useEffect, useState } from 'react';
import { getCredentials, type Credential } from '../api/credentials';
import { getExperience, type Experience } from '../api/experience';
import { getProfile, type Profile } from '../api/profile';
import { getProjects, type Project } from '../api/projectstate';
import { getSkills, type Skill } from '../api/skills';
import { getTestimonials, type Testimonial } from '../api/testimonials';

/** Loads the public profile and project list together, with a retry for when the API is unreachable. */
export function usePortfolio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPortfolio = useCallback(
    () =>
      // Experience, testimonials, credentials and skills are optional extras: if they fail, show the rest of the page without them.
      Promise.all([
        getProfile(),
        getProjects(),
        getExperience().catch(() => []),
        getTestimonials().catch(() => []),
        getCredentials().catch(() => []),
        getSkills().catch(() => []),
      ])
        .then(([prof, projs, exp, quotes, creds, skillList]) => {
          setProfile(prof);
          setProjects(projs);
          setExperience(exp);
          setTestimonials(quotes);
          setCredentials(creds);
          setSkills(skillList);
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

  return { profile, projects, experience, testimonials, credentials, skills, loading, error, retry };
}
