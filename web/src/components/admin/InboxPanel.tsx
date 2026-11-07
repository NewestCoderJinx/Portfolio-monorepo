import { useState } from 'react';
import { Badge, Box, Button, Collapse, HStack, Spinner, Text, useToast, VStack } from '@chakra-ui/react';
import { deleteMessage, setMessageRead, type Message } from '../../api/messages';
import { apiErrorMessage } from '../../api/profile';
import type { useInbox } from '../../hooks/useInbox';

type Inbox = ReturnType<typeof useInbox>;

const formatWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const replyLink = (m: Message) =>
  `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: your message')}&body=${encodeURIComponent(
    `\n\n---\nOn ${formatWhen(m.createdAt)}, ${m.name} wrote:\n${m.body}`,
  )}`;

export function InboxPanel({ inbox }: { inbox: Inbox }) {
  const { messages, setMessages, loading, failed, reload, unread } = inbox;
  const [openId, setOpenId] = useState<string | null>(null);
  const toast = useToast();

  const update = (id: string, patch: Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const setRead = async (m: Message, read: boolean) => {
    update(m.id, { read });
    try {
      await setMessageRead(m.id, read);
    } catch (err) {
      update(m.id, { read: m.read });
      toast({ title: apiErrorMessage(err, 'Could not update message'), status: 'error', duration: 4000, isClosable: true });
    }
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

  return (
    <VStack align="stretch" spacing={3}>
      <HStack justify="space-between">
        <Text fontSize="sm" color="fg.muted">
          {messages.length === 0 ? 'No messages yet.' : `${messages.length} message${messages.length === 1 ? '' : 's'}, ${unread} unread`}
        </Text>
        <Button size="xs" variant="ghost" onClick={reload}>
          Refresh
        </Button>
      </HStack>

      {messages.length === 0 && (
        <Box textAlign="center" py={12} bg="bg.surface" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="border.strong">
          <Text color="fg.muted" fontSize="sm">
            Messages sent through the contact form on your public page will appear here.
          </Text>
        </Box>
      )}

      {messages.map((m) => {
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
                <HStack spacing={2} flexWrap="wrap">
                  <Button as="a" href={replyLink(m)} size="sm" colorScheme="brand">
                    Reply by email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRead(m, !m.read)}>
                    Mark as {m.read ? 'unread' : 'read'}
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
