import { useState } from 'react';
import { Badge, Box, Button, ButtonGroup, Collapse, HStack, Input, InputGroup, InputLeftElement, InputRightElement, Spinner, Text, useToast, VStack } from '@chakra-ui/react';
import { deleteMessage, markAllMessagesRead, updateMessage, type Message, type MessageFlags } from '../../api/messages';
import { apiErrorMessage } from '../../api/profile';
import type { useInbox } from '../../hooks/useInbox';
import { EmailAlertsBar } from './EmailAlertsBar';

type Inbox = ReturnType<typeof useInbox>;

type View = 'inbox' | 'unread' | 'archived';

const VIEWS: { id: View; label: string; matches: (m: Message) => boolean }[] = [
  { id: 'inbox', label: 'Inbox', matches: (m) => !m.archived },
  { id: 'unread', label: 'Unread', matches: (m) => !m.archived && !m.read },
  { id: 'archived', label: 'Archived', matches: (m) => m.archived },
];

const EMPTY_TEXT: Record<View, string> = {
  inbox: 'Messages sent through the contact form on your public page will appear here.',
  unread: 'You are all caught up.',
  archived: 'Archived messages are kept here, out of your inbox.',
};

const formatWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const replyLink = (m: Message) =>
  `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: your message')}&body=${encodeURIComponent(
    `\n\n---\nOn ${formatWhen(m.createdAt)}, ${m.name} wrote:\n${m.body}`,
  )}`;

export function InboxPanel({ inbox }: { inbox: Inbox }) {
  const { messages, setMessages, loading, failed, reload, unread } = inbox;
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>('inbox');
  const [query, setQuery] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const toast = useToast();

  const update = (id: string, patch: Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  /** Optimistic; rolls back to the server's last known state on failure. */
  const setFlags = async (m: Message, flags: MessageFlags, optimistic: Partial<Message>): Promise<boolean> => {
    update(m.id, optimistic);
    try {
      update(m.id, await updateMessage(m.id, flags));
      return true;
    } catch (err) {
      update(m.id, m);
      toast({ title: apiErrorMessage(err, 'Could not update message'), status: 'error', duration: 4000, isClosable: true });
      return false;
    }
  };

  const setRead = (m: Message, read: boolean) => setFlags(m, { read }, { read });

  const markReplied = (m: Message) => {
    if (m.repliedAt) return;
    setFlags(m, { replied: true }, { repliedAt: new Date().toISOString(), read: true });
  };

  const clearReplied = (m: Message) => setFlags(m, { replied: false }, { repliedAt: null });

  const copyEmail = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.email);
      toast({ title: 'Email address copied', status: 'success', duration: 2000, isClosable: true });
    } catch {
      toast({ title: 'Could not copy', description: m.email, status: 'warning', duration: 5000, isClosable: true });
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    const before = messages;
    setMessages((prev) => prev.map((m) => (m.archived ? m : { ...m, read: true })));
    try {
      const updated = await markAllMessagesRead();
      toast({ title: `Marked ${updated} message${updated === 1 ? '' : 's'} as read`, status: 'success', duration: 2500, isClosable: true });
    } catch (err) {
      setMessages(before);
      toast({ title: apiErrorMessage(err, 'Could not mark messages as read'), status: 'error', duration: 4000, isClosable: true });
    } finally {
      setMarkingAll(false);
    }
  };

  const setArchived = async (m: Message, archived: boolean) => {
    if (openId === m.id) setOpenId(null);
    if (!(await setFlags(m, { archived }, { archived }))) return;
    toast({ title: archived ? 'Archived' : 'Moved back to the inbox', status: 'success', duration: 2000, isClosable: true });
  };

  const toggle = (m: Message) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.read) setRead(m, true);
  };

  const remove = async (m: Message) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await deleteMessage(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      toast({ title: 'Message deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: apiErrorMessage(err, 'Could not delete message'), status: 'error', duration: 4000, isClosable: true });
    }
  };

  if (loading) {
    return (
      <VStack py={12}>
        <Spinner color="brand.500" />
      </VStack>
    );
  }

  if (failed) {
    return (
      <VStack py={12} spacing={3}>
        <Text color="fg.muted">Couldn't load messages.</Text>
        <Button size="sm" onClick={reload}>
          Retry
        </Button>
      </VStack>
    );
  }

  const needle = query.trim().toLowerCase();
  const matchesQuery = (m: Message) => !needle || [m.name, m.email, m.body].some((t) => t.toLowerCase().includes(needle));
  const shown = messages.filter(VIEWS.find((v) => v.id === view)!.matches).filter(matchesQuery);

  return (
    <VStack align="stretch" spacing={3}>
      <EmailAlertsBar />
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <ButtonGroup size="sm" isAttached variant="outline" role="tablist" aria-label="Messages">
          {VIEWS.map((v) => {
            const count = messages.filter(v.matches).length;
            return (
              <Button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                variant={view === v.id ? 'solid' : 'outline'}
                colorScheme={view === v.id ? 'brand' : 'gray'}
                onClick={() => {
                  setView(v.id);
                  setOpenId(null);
                }}
              >
                {v.label}
                {count > 0 && (
                  <Text as="span" ml={1.5} fontWeight="normal" opacity={0.8}>
                    {count}
                  </Text>
                )}
              </Button>
            );
          })}
        </ButtonGroup>
        <HStack spacing={2}>
          <Text fontSize="sm" color="fg.muted">
            {unread} unread
          </Text>
          {unread > 0 && (
            <Button size="xs" variant="ghost" colorScheme="brand" onClick={markAllRead} isLoading={markingAll}>
              Mark all as read
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={reload}>
            Refresh
          </Button>
        </HStack>
      </HStack>

      {messages.length > 0 && (
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" color="fg.subtle">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" strokeLinecap="round" />
            </svg>
          </InputLeftElement>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or message"
            aria-label="Search messages"
            borderRadius="md"
            bg="bg.surface"
          />
          {query && (
            <InputRightElement>
              <Button size="xs" variant="ghost" onClick={() => setQuery('')} aria-label="Clear search">
                ×
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
      )}

      {shown.length === 0 && (
        <Box textAlign="center" py={12} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
          <Text color="fg.muted" fontSize="sm">
            {messages.length === 0 ? EMPTY_TEXT.inbox : needle ? `No messages match "${query.trim()}".` : EMPTY_TEXT[view]}
          </Text>
        </Box>
      )}

      {shown.map((m) => {
        const open = openId === m.id;
        return (
          <Box
            key={m.id}
            bg="bg.surface"
            borderWidth="1px"
            borderColor={open ? 'brand.400' : 'border.default'}
            borderLeftWidth="4px"
            borderLeftColor={m.read ? 'border.default' : 'accent.400'}
            borderRadius="lg"
            overflow="hidden"
          >
            <Box
              as="button"
              type="button"
              w="full"
              textAlign="left"
              px={4}
              py={3}
              onClick={() => toggle(m)}
              aria-expanded={open}
              _hover={{ bg: 'bg.subtle' }}
            >
              <HStack justify="space-between" align="start" gap={3}>
                <Box minW={0}>
                  <HStack spacing={2}>
                    <Text fontWeight={m.read ? 'medium' : 'bold'} color="fg.heading" noOfLines={1}>
                      {m.name}
                    </Text>
                    {!m.read && (
                      <Badge colorScheme="accent" variant="subtle" borderRadius="full" fontSize="2xs">
                        New
                      </Badge>
                    )}
                    {m.repliedAt && (
                      <Badge colorScheme="green" variant="subtle" borderRadius="full" fontSize="2xs">
                        Replied
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="fg.muted" noOfLines={1}>
                    {m.email}
                  </Text>
                  {!open && (
                    <Text fontSize="sm" color="fg.secondary" noOfLines={1} mt={1}>
                      {m.body}
                    </Text>
                  )}
                </Box>
                <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
                  {formatWhen(m.createdAt)}
                </Text>
              </HStack>
            </Box>

            <Collapse in={open} animateOpacity>
              <Box px={4} pb={4}>
                <Text whiteSpace="pre-wrap" color="fg.default" fontSize="sm" lineHeight="tall" py={3} borderTopWidth="1px" borderColor="border.subtle">
                  {m.body}
                </Text>
                {m.repliedAt && (
                  <HStack spacing={2} mb={3} fontSize="xs" color="fg.muted">
                    <Text>You replied {formatWhen(m.repliedAt)}.</Text>
                    <Button size="xs" variant="link" colorScheme="gray" onClick={() => clearReplied(m)}>
                      Mark as not replied
                    </Button>
                  </HStack>
                )}
                <HStack spacing={2} flexWrap="wrap">
                  <Button as="a" href={replyLink(m)} size="sm" colorScheme="brand" onClick={() => markReplied(m)}>
                    Reply by email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyEmail(m)}>
                    Copy email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRead(m, !m.read)}>
                    Mark as {m.read ? 'unread' : 'read'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setArchived(m, !m.archived)}>
                    {m.archived ? 'Move to inbox' : 'Archive'}
                  </Button>
                  <Button size="sm" variant="ghost" colorScheme="red" onClick={() => remove(m)}>
                    Delete
                  </Button>
                </HStack>
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </VStack>
  );
}
