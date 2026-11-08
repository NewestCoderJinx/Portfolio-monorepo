import { useEffect, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { changePassword, getAccount, type Account } from '../../api/auth';
import { apiErrorMessage } from '../../api/profile';

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="bold" color="fg.secondary">
        {label}
      </Text>
      <Text color="fg.default" wordBreak="break-all">
        {value}
      </Text>
    </Box>
  );
}

export function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getAccount()
      .then(setAccount)
      .catch(() => toast({ title: 'Failed to load account details', status: 'error', duration: 4000, isClosable: true }));
  }, [toast]);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;
  const sameAsCurrent = next.length > 0 && next === current;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (next.length < MIN_LENGTH || next !== confirm || next === current) return;
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setSubmitted(false);
      setAccount((prev) => (prev ? { ...prev, passwordChangedAt: new Date().toISOString() } : prev));
      toast({
        title: 'Password changed',
        description: 'Any other devices where you were signed in have been signed out.',
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
    } catch (err) {
      toast({ title: 'Password not changed', description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default">
        <Heading as="h2" size="sm" mb={4} color="fg.default">
          Your Account
        </Heading>
        {account ? (
          <VStack align="stretch" spacing={4}>
            <Detail label="Signed in as" value={account.email} />
            <Detail label="Account created" value={formatDate(account.createdAt)} />
            <Detail label="Password last changed" value={account.passwordChangedAt ? formatDate(account.passwordChangedAt) : 'Never'} />
          </VStack>
        ) : (
          <VStack align="stretch" spacing={4}>
            <Skeleton h="40px" />
            <Skeleton h="40px" />
            <Skeleton h="40px" />
          </VStack>
        )}
      </Box>

      <Box as="form" onSubmit={handleSubmit} p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default" noValidate>
        <Heading as="h2" size="sm" mb={1} color="fg.default">
          Change Password
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          This also signs you out on every other device.
        </Text>
        <VStack spacing={4}>
          <FormControl isRequired isInvalid={submitted && !current}>
            <FormLabel {...label}>Current password</FormLabel>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <FormErrorMessage>Enter your current password.</FormErrorMessage>
          </FormControl>
          <FormControl isRequired isInvalid={(submitted || tooShort) && (next.length < MIN_LENGTH || sameAsCurrent)}>
            <FormLabel {...label}>New password</FormLabel>
            <Input type="password" autoComplete="new-password" value={next} maxLength={MAX_LENGTH} onChange={(e) => setNext(e.target.value)} />
            {sameAsCurrent ? (
              <FormErrorMessage>Choose a password different from your current one.</FormErrorMessage>
            ) : (
              <FormErrorMessage>Use at least {MIN_LENGTH} characters.</FormErrorMessage>
            )}
            <FormHelperText fontSize="xs">At least {MIN_LENGTH} characters. A short phrase is easier to remember.</FormHelperText>
          </FormControl>
          <FormControl isRequired isInvalid={(submitted && !confirm) || mismatch}>
            <FormLabel {...label}>Confirm new password</FormLabel>
            <Input type="password" autoComplete="new-password" value={confirm} maxLength={MAX_LENGTH} onChange={(e) => setConfirm(e.target.value)} />
            <FormErrorMessage>{mismatch ? 'The passwords don’t match.' : 'Type the new password again.'}</FormErrorMessage>
          </FormControl>
          <Button type="submit" colorScheme="brand" w="full" isLoading={saving} loadingText="Changing">
            Change Password
          </Button>
        </VStack>
      </Box>
    </SimpleGrid>
  );
}
