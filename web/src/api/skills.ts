import API from './axios';

export interface Skill {
  id: string;
  name: string;
  /** e.g. "Languages"; null groups the skill under "Other". */
  category?: string | null;
  sortOrder?: number;
}

export type SkillInput = Pick<Skill, 'name' | 'category'>;

/** In manual order (ordered by the API). */
export const getSkills = async (): Promise<Skill[]> => {
  const res = await API.get<Skill[]>('/skills');
  return res.data;
};

export const createSkill = async (data: SkillInput): Promise<Skill> => {
  const res = await API.post<Skill>('/skills', data);
  return res.data;
};

export const updateSkill = async (id: string, data: Partial<SkillInput>): Promise<Skill> => {
  const res = await API.patch<Skill>(`/skills/${id}`, data);
  return res.data;
};

export const reorderSkills = async (ids: string[]): Promise<Skill[]> => {
  const res = await API.patch<Skill[]>('/skills/reorder', { ids });
  return res.data;
};

export const deleteSkill = async (id: string): Promise<void> => {
  await API.delete(`/skills/${id}`);
};

export const OTHER_CATEGORY = 'Other';

export interface SkillGroup {
  category: string;
  skills: Skill[];
}

/**
 * Groups skills by category, keeping the manual order: groups appear in the order of their first skill,
 * except uncategorized skills, which always come last as "Other".
 */
export const groupSkills = (skills: Skill[]): SkillGroup[] => {
  const groups = new Map<string, SkillGroup>();
  const other: Skill[] = [];
  for (const s of skills) {
    const category = s.category?.trim();
    if (!category || category.toLowerCase() === OTHER_CATEGORY.toLowerCase()) {
      other.push(s);
      continue;
    }
    const key = category.toLowerCase();
    if (!groups.has(key)) groups.set(key, { category, skills: [] });
    groups.get(key)!.skills.push(s);
  }
  const result = [...groups.values()];
  if (other.length) result.push({ category: OTHER_CATEGORY, skills: other });
  return result;
};
