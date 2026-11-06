import API from './axios';

export interface Experience {
  id: string;
  role: string;
  company: string;
  location?: string | null;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD, or null for a current role. */
  endDate?: string | null;
  description?: string | null;
  skills?: string[] | null;
}

export type ExperienceInput = Omit<Experience, 'id'>;

/** Current roles first, then newest first (ordered by the API). */
export const getExperience = async (): Promise<Experience[]> => {
  const res = await API.get<Experience[]>('/experience');
  return res.data;
};

export const createExperience = async (data: ExperienceInput): Promise<Experience> => {
  const res = await API.post<Experience>('/experience', data);
  return res.data;
};

export const updateExperience = async (id: string, data: Partial<ExperienceInput>): Promise<Experience> => {
  const res = await API.patch<Experience>(`/experience/${id}`, data);
  return res.data;
};

export const deleteExperience = async (id: string): Promise<void> => {
  await API.delete(`/experience/${id}`);
};

/** Parses YYYY-MM-DD as a local date, so the month never shifts with the time zone. */
const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const monthYear = (iso: string) => parseDay(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

/** "Jan 2023 – Present" */
export const formatPeriod = (e: Pick<Experience, 'startDate' | 'endDate'>) =>
  `${monthYear(e.startDate)} – ${e.endDate ? monthYear(e.endDate) : 'Present'}`;

/** "2 yrs 3 mos", counting both the first and last month. */
export const formatDuration = (e: Pick<Experience, 'startDate' | 'endDate'>, now = new Date()) => {
  const start = parseDay(e.startDate);
  const end = e.endDate ? parseDay(e.endDate) : now;
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const part = (n: number, unit: string) => (n ? `${n} ${unit}${n === 1 ? '' : 's'}` : '');
  return [part(years, 'yr'), part(rest, 'mo')].filter(Boolean).join(' ');
};
