import type { Project } from '../../api/projectstate';

export const CASE_STUDY_SECTIONS = [
  { key: 'problem', title: 'The Problem' },
  { key: 'solution', title: 'The Solution' },
  { key: 'decisions', title: 'Key Engineering Decisions' },
  { key: 'challenges', title: 'Challenges Encountered' },
  { key: 'lessonsLearned', title: 'Lessons Learned' },
] as const;

export const hasCaseStudy = (p: Project): boolean =>
  CASE_STUDY_SECTIONS.some((s) => Boolean(p[s.key]?.trim()));

export const formatProjectDate = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};
