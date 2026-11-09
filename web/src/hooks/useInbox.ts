import { useCallback, useEffect, useState } from 'react';
import { getMessages, type Message } from '../api/messages';

/** Loads the inbox once for the whole Admin page, so the tab can show an unread count. */
export function useInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(
    () =>
      getMessages()
        .then((list) => {
          setMessages(list);
          setFailed(false);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  // Archived messages are filed away, so they don't count as waiting.
  const unread = messages.filter((m) => !m.read && !m.archived).length;
  return { messages, setMessages, loading, failed, reload, unread };
}
