import { useEffect, useState } from 'react';
import { Badge, Box, Button, ButtonGroup, Flex, Heading, Skeleton, Text, useToast, VStack } from '@chakra-ui/react';
import { describeAuditEvent, getAuditEvents, type AuditEvent, type AuditKind } from '../../api/audit';
import { describeUserAgent } from '../../api/auth';

const PAGE = 50;
const FILTERS: { kind: AuditKind; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'security', label: 'Security' },
  { kind: 'content', label: 'Content' },
];
const BADGES = {
  failed: { color: 'orange', word: 'Failed' },
  blocked: { color: 'red', word: 'Blocked' },
  notice: { color: 'purple', word: 'Note' },
} as const;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** What happened in the Admin area: sign-ins, security changes and content edits, newest first. */
export function ActivityPanel() {
  const [kind, setKind] = useState<AuditKind>('all');
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const toast = useToast();

  const failed = () => toast({ title: 'Failed to load activity', status: 'error', duration: 4000, isClosable: true });

  useEffect(() => {
    let current = true; // ignore a slow response for a filter that's no longer selected
    getAuditEvents(kind, undefined, PAGE)
      .then((page) => {
        if (!current) return;
        setEvents(page);
        setMore(page.length === PAGE);
      })
      .catch(() => {
        if (!current) return;
        setEvents([]);
        toast({ title: 'Failed to load activity', status: 'error', duration: 4000, isClosable: true });
      });
    return () => {
      current = false;
    };
  }, [kind, toast]);

  const loadMore = async () => {
    if (!events?.length) return;
    setLoadingMore(true);
    try {
      const page = await getAuditEvents(kind, events[events.length - 1].createdAt, PAGE);
      setEvents([...events, ...page]);
      setMore(page.length === PAGE);
    } catch {
      failed();
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
      <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
        <Box>
          <Heading as="h2" size="sm" mb={1} color="fg.default">
            Activity
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            Sign-ins, security changes and edits from the last 90 days.
          </Text>
        </Box>
        <ButtonGroup size="sm" isAttached variant="outline" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <Button
              key={f.kind}
              aria-pressed={kind === f.kind}
              colorScheme={kind === f.kind ? 'brand' : 'gray'}
              variant={kind === f.kind ? 'solid' : 'outline'}
              onClick={() => {
                if (f.kind === kind) return;
                setEvents(null);
                setKind(f.kind);
              }}
            >
              {f.label}
            </Button>
          ))}
        </ButtonGroup>
      </Flex>

      {!events ? (
        <VStack align="stretch" spacing={3}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h="44px" />
          ))}
        </VStack>
      ) : events.length === 0 ? (
        <Text color="fg.muted" py={6} textAlign="center">
          Nothing here yet.
        </Text>
      ) : (
        <>
          <VStack as="ol" listStyleType="none" align="stretch" spacing={0} divider={<Box borderTopWidth="1px" borderColor="border.default" />}>
            {events.map((e) => {
              const { text, tone } = describeAuditEvent(e);
              const where = [e.ip, e.userAgent ? describeUserAgent(e.userAgent) : null].filter(Boolean).join(' · ');
              return (
                <Box as="li" key={e.id} py={3}>
                  <Flex align="center" gap={2} wrap="wrap">
                    {tone !== 'normal' && <Badge colorScheme={BADGES[tone].color}>{BADGES[tone].word}</Badge>}
                    <Text color="fg.default" fontWeight={tone === 'normal' ? 'normal' : 'semibold'} wordBreak="break-word">
                      {text}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="fg.muted">
                    <time dateTime={e.createdAt}>{formatTime(e.createdAt)}</time>
                    {where && ` · ${where}`}
                  </Text>
                </Box>
              );
            })}
          </VStack>
          {more && (
            <Button mt={4} size="sm" variant="ghost" w="full" onClick={loadMore} isLoading={loadingMore}>
              Show older
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
