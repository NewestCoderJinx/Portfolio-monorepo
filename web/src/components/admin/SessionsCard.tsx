import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Heading, Skeleton, Stack, Text, useToast, VStack } from '@chakra-ui/react';
import { describeUserAgent, getSessions, revokeOtherSessions, revokeSession, type SessionInfo } from '../../api/auth';
import { apiErrorMessage } from '../../api/profile';

const formatWhen = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

/** Where the owner is signed in, with a way to sign any of those out. `refreshKey` reloads the list. */
export function SessionsCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    getSessions()
      .then(setSessions)
      .catch(() => toast({ title: 'Failed to load sessions', status: 'error', duration: 4000, isClosable: true }));
  }, [toast]);

  useEffect(load, [load, refreshKey]);

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await action();
      toast({ title: done, status: 'success', duration: 4000, isClosable: true });
      load();
    } catch (err) {
      toast({ title: 'Couldn’t sign out', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setBusy(null);
    }
  };

  const others = sessions?.filter((s) => !s.current).length ?? 0;

  return (
    <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default" gridColumn={{ lg: '1 / -1' }}>
      <Flex justify="space-between" align={{ base: 'start', sm: 'center' }} gap={3} mb={4} direction={{ base: 'column', sm: 'row' }}>
        <Box>
          <Heading as="h2" size="sm" mb={1} color="fg.default">
            Where You’re Signed In
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            Each sign-in lasts a day. Sign out anything you don’t recognise, then change your password.
          </Text>
        </Box>
        <Button
          size="sm"
          variant="outline"
          colorScheme="red"
          flexShrink={0}
          isDisabled={others === 0}
          isLoading={busy === 'others'}
          onClick={() => run('others', revokeOtherSessions, 'Signed out everywhere else')}
        >
          Sign out all others
        </Button>
      </Flex>

      {sessions ? (
        <VStack as="ul" listStyleType="none" align="stretch" spacing={0} divider={<Box borderTopWidth="1px" borderColor="border.default" />}>
          {sessions.map((s) => (
            <Stack as="li" key={s.id} direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'start', sm: 'center' }} py={3} gap={2}>
              <Box minW={0}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Text fontWeight="semibold" color="fg.default">
                    {describeUserAgent(s.userAgent)}
                  </Text>
                  {s.current && <Badge colorScheme="green">This browser</Badge>}
                </Flex>
                <Text fontSize="sm" color="fg.muted">
                  {[s.ip, `active ${formatWhen(s.lastSeenAt)}`, `signed in ${formatWhen(s.createdAt)}`].filter(Boolean).join(' · ')}
                </Text>
              </Box>
              {!s.current && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  flexShrink={0}
                  isLoading={busy === s.id}
                  aria-label={`Sign out ${describeUserAgent(s.userAgent)}`}
                  onClick={() => run(s.id, () => revokeSession(s.id), 'Session signed out')}
                >
                  Sign out
                </Button>
              )}
            </Stack>
          ))}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Skeleton h="44px" />
          <Skeleton h="44px" />
        </VStack>
      )}
    </Box>
  );
}
