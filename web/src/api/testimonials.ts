import API from './axios';

export interface Testimonial {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatarUrl?: string | null;
  /** e.g. the person's LinkedIn profile, so visitors can verify them. */
  linkUrl?: string | null;
  /** false = hidden from the public page. */
  published?: boolean;
}

export type TestimonialInput = Omit<Testimonial, 'id'>;

/** Published testimonials, newest first. */
export const getTestimonials = async (): Promise<Testimonial[]> => {
  const res = await API.get<Testimonial[]>('/testimonials');
  return res.data;
};

/** Every testimonial including hidden ones; requires login. */
export const getAllTestimonials = async (): Promise<Testimonial[]> => {
  const res = await API.get<Testimonial[]>('/testimonials/manage');
  return res.data;
};

export const createTestimonial = async (data: TestimonialInput): Promise<Testimonial> => {
  const res = await API.post<Testimonial>('/testimonials', data);
  return res.data;
};

export const updateTestimonial = async (id: string, data: Partial<TestimonialInput>): Promise<Testimonial> => {
  const res = await API.patch<Testimonial>(`/testimonials/${id}`, data);
  return res.data;
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  await API.delete(`/testimonials/${id}`);
};

/** "Engineering Manager, Acme" from whichever parts are set. */
export const formatAttribution = (t: Pick<Testimonial, 'role' | 'company'>) => [t.role, t.company].filter(Boolean).join(', ');
