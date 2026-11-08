import API from './axios';

export type CredentialKind = 'education' | 'certification';

export interface Credential {
  id: string;
  kind: CredentialKind;
  /** Degree, course or certificate name. */
  title: string;
  /** School or issuing organisation. */
  institution: string;
  /** YYYY-MM-DD */
  startDate?: string | null;
  /** Graduation or issue date; null on education means still studying. */
  endDate?: string | null;
  credentialUrl?: string | null;
  description?: string | null;
}

export type CredentialInput = Omit<Credential, 'id'>;

/** In-progress first, then newest first (ordered by the API). */
export const getCredentials = async (): Promise<Credential[]> => {
  const res = await API.get<Credential[]>('/credentials');
  return res.data;
};

export const createCredential = async (data: CredentialInput): Promise<Credential> => {
  const res = await API.post<Credential>('/credentials', data);
  return res.data;
};

export const updateCredential = async (id: string, data: Partial<CredentialInput>): Promise<Credential> => {
  const res = await API.patch<Credential>(`/credentials/${id}`, data);
  return res.data;
};

export const deleteCredential = async (id: string): Promise<void> => {
  await API.delete(`/credentials/${id}`);
};

/** Parses YYYY-MM-DD as a local date, so the month never shifts with the time zone. */
const monthYear = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

/** "Sep 2019 – Jun 2023", "Sep 2019 – Present", "Issued Mar 2025", or "" when no dates are set. */
export const formatCredentialDates = (c: Pick<Credential, 'kind' | 'startDate' | 'endDate'>): string => {
  if (c.kind === 'certification') return c.endDate ? `Issued ${monthYear(c.endDate)}` : '';
  if (c.startDate) return `${monthYear(c.startDate)} – ${c.endDate ? monthYear(c.endDate) : 'Present'}`;
  return c.endDate ? monthYear(c.endDate) : '';
};

export const KIND_LABELS: Record<CredentialKind, string> = { education: 'Education', certification: 'Certification' };
