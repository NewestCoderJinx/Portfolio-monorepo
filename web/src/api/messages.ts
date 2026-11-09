import API from './axios';

export interface Message {
  id: string;
  name: string;
  email: string;
  body: string;
  read: boolean;
  /** Kept, but out of the inbox. */
  archived: boolean;
  /** ISO time the owner first replied, or null. */
  repliedAt: string | null;
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

export interface MessageFlags {
  read?: boolean;
  archived?: boolean;
  /** true records a reply (keeping the first time); false clears it. */
  replied?: boolean;
}

export const updateMessage = async (id: string, flags: MessageFlags): Promise<Message> => {
  const res = await API.patch<Message>(`/messages/${id}`, flags);
  return res.data;
};

/** Marks every unread inbox message read (archived ones are left alone). */
export const markAllMessagesRead = async (): Promise<number> => {
  const res = await API.patch<{ updated: number }>('/messages/read-all');
  return res.data.updated;
};

export const deleteMessage = async (id: string): Promise<void> => {
  await API.delete(`/messages/${id}`);
};
