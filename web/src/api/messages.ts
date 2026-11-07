import API from './axios';

export interface Message {
  id: string;
  name: string;
  email: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NewMessage {
  name: string;
  email: string;
  body: string;
  /** Honeypot field: must stay empty for real visitors. */
  website?: string;
}

export const sendMessage = async (data: NewMessage): Promise<void> => {
  await API.post('/messages', data);
};

/** Newest first. Requires login. */
export const getMessages = async (): Promise<Message[]> => {
  const res = await API.get<Message[]>('/messages');
  return res.data;
};

export const setMessageRead = async (id: string, read: boolean): Promise<Message> => {
  const res = await API.patch<Message>(`/messages/${id}`, { read });
  return res.data;
};

export const deleteMessage = async (id: string): Promise<void> => {
  await API.delete(`/messages/${id}`);
};
