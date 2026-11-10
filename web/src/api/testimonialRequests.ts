import API from './axios';

/** A private link that lets someone write a testimonial (Admin view). */
export interface TestimonialRequest {
  id: string;
  token: string;
  recipientName: string | null;
  note: string | null;
  expiresAt: string;
  usedAt: string | null;
  testimonialId: string | null;
  createdAt: string;
}

/** What the public form shows. */
export interface RequestInvite {
  recipientName: string | null;
  note: string | null;
  ownerName: string | null;
  ownerHeadline: string | null;
}

export interface TestimonialSubmission {
  name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  linkUrl?: string | null;
  /** Honeypot: must stay empty for real people. */
  website?: string;
}

/** The link to send, on this site. */
export const requestLink = (r: Pick<TestimonialRequest, 'token'>) => `${window.location.origin}/testimonial/${r.token}`;

export const getTestimonialRequests = async (): Promise<TestimonialRequest[]> => {
  const res = await API.get<TestimonialRequest[]>('/testimonial-requests');
  return res.data;
};

export const createTestimonialRequest = async (data: { recipientName?: string | null; note?: string | null }): Promise<TestimonialRequest> => {
  const res = await API.post<TestimonialRequest>('/testimonial-requests', data);
  return res.data;
};

export const revokeTestimonialRequest = async (id: string): Promise<void> => {
  await API.delete(`/testimonial-requests/${id}`);
};

export const getRequestInvite = async (token: string): Promise<RequestInvite> => {
  const res = await API.get<RequestInvite>(`/testimonial-requests/${encodeURIComponent(token)}`);
  return res.data;
};

export const submitTestimonial = async (token: string, data: TestimonialSubmission): Promise<void> => {
  await API.post(`/testimonial-requests/${encodeURIComponent(token)}`, data);
};
