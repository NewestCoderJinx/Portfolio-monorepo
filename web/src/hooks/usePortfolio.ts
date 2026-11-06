import { useCallback, useEffect, useState } from 'react';
import { getProfile, type Profile } from '../api/profile';
import { getProjects, type Project } from '../api/projectstate';

/** Loads the public profile and project list together, with a retry for when the API is unreachable. */
export function usePortfolio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPortfolio = useCallback(
    () =>
      Promise.all([getProfile(), getProjects()])
        .then(([prof, projs]) => {
          setProfile(prof);
          setProjects(projs);
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

  return { profile, projects, loading, error, retry };
}
