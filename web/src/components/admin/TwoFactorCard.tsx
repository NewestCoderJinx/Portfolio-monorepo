import { useState, type FormEvent } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useClipboard,
  useToast,
  VStack,
} from '@chakra-ui/react';
import QRCode from 'qrcode';
import { disableTwoFactor, enableTwoFactor, regenerateRecoveryCodes, setupTwoFactor, type Account } from '../../api/auth';
import { apiErrorMessage } from '../../api/profile';

type Mode = 'idle' | 'setup' | 'codes' | 'regenerate' | 'disable';

const label = { fontSize: 'xs', fontWeight: 'bold', color: 'fg.secondary', mb: 1 } as const;
const codeInput = { fontFamily: 'mono', letterSpacing: 'widest', autoComplete: 'one-time-code', maxLength: 20 } as const;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** Shown once, straight after the codes are made. */
function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const text = codes.join('\n');
  const { hasCopied, onCopy } = useClipboard(text);
  const download = () => {
    const url = URL.createObjectURL(new Blob([`Portfolio admin recovery codes\nEach code works once.\n\n${text}\n`], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'portfolio-recovery-codes.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="warning" borderRadius="md" fontSize="sm">
        <AlertIcon />
        Save these somewhere safe, like a password manager. Each one signs you in once if you lose your phone, and they won’t be
        shown again.
      </Alert>
      <SimpleGrid as="ul" listStyleType="none" columns={2} spacing={2} p={4} bg="bg.canvas" borderRadius="md" aria-label="Recovery codes">
        {codes.map((c) => (
          <Text as="li" key={c} fontFamily="mono" fontSize="sm" color="fg.default">
            {c}
          </Text>
        ))}
      </SimpleGrid>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={2}>
        <Button size="sm" variant="outline" onClick={onCopy}>
          {hasCopied ? 'Copied' : 'Copy'}
        </Button>
        <Button size="sm" variant="outline" onClick={download}>
          Download .txt
        </Button>
        <Button size="sm" colorScheme="brand" onClick={onDone} ml={{ sm: 'auto' }}>
          I’ve saved them
        </Button>
      </Stack>
    </VStack>
  );
}

/** Turns authenticator-app codes at sign-in on and off. `onChanged` reloads the account details. */
export function TwoFactorCard({ account, onChanged }: { account: Account | null; onChanged: () => void }) {
  const [mode, setModeState] = useState<Mode>('idle');
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const enabled = Boolean(account?.twoFactorEnabledAt);

  // Never leave a half-typed password or code behind when switching between forms.
  const setMode = (next: Mode) => {
    setCode('');
    setPassword('');
    setModeState(next);
  };

  const fail = (title: string, err: unknown) =>
    toast({ title, description: apiErrorMessage(err, 'Please try again.'), status: 'error', duration: 6000, isClosable: true });

  const startSetup = async () => {
    setBusy(true);
    try {
      const { secret, otpauthUrl } = await setupTwoFactor();
      setSetup({ secret, qr: await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 200 }) });
      setMode('setup');
    } catch (err) {
      fail('Couldn’t start setup', err);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'setup') {
        setCodes(await enableTwoFactor(code));
        setSetup(null);
        setMode('codes');
        toast({ title: 'Two-step verification is on', status: 'success', duration: 5000, isClosable: true });
        onChanged();
      } else if (mode === 'regenerate') {
        setCodes(await regenerateRecoveryCodes(code));
        setMode('codes');
        onChanged();
      } else if (mode === 'disable') {
        await disableTwoFactor(password, code);
        setMode('idle');
        toast({ title: 'Two-step verification is off', status: 'info', duration: 5000, isClosable: true });
        onChanged();
      }
    } catch (err) {
      fail('That didn’t work', err);
    } finally {
      setBusy(false);
    }
  };

  const cancel = (
    <Button variant="ghost" onClick={() => setMode('idle')} isDisabled={busy}>
      Cancel
    </Button>
  );

  let body;
  if (!account) {
    body = <Skeleton h="80px" />;
  } else if (mode === 'codes') {
    body = <RecoveryCodes codes={codes} onDone={() => setMode('idle')} />;
  } else if (mode === 'setup' && setup) {
    body = (
      <Stack as="form" onSubmit={submit} direction={{ base: 'column', md: 'row' }} spacing={6} align={{ md: 'start' }}>
        <Box flexShrink={0} alignSelf={{ base: 'center', md: 'start' }} bg="white" p={2} borderRadius="md" borderWidth="1px" borderColor="border.default">
          <Image src={setup.qr} alt="QR code to add this site to your authenticator app" boxSize="180px" />
        </Box>
        <VStack align="stretch" spacing={4} flex={1}>
          <Text fontSize="sm" color="fg.default">
            1. Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Aegis…). Can’t
            scan? Enter this key instead:
          </Text>
          <Code p={2} borderRadius="md" fontSize="sm" wordBreak="break-all">
            {setup.secret.match(/.{1,4}/g)?.join(' ')}
          </Code>
          <FormControl isRequired>
            <FormLabel {...label}>2. Enter the 6-digit code it shows</FormLabel>
            <Input {...codeInput} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </FormControl>
          <HStack>
            <Button type="submit" colorScheme="brand" isLoading={busy} isDisabled={code.trim().length < 6}>
              Turn on
            </Button>
            {cancel}
          </HStack>
        </VStack>
      </Stack>
    );
  } else if (mode === 'regenerate' || mode === 'disable') {
    body = (
      <VStack as="form" onSubmit={submit} align="stretch" spacing={4} maxW="sm">
        {mode === 'disable' && (
          <FormControl isRequired>
            <FormLabel {...label}>Password</FormLabel>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </FormControl>
        )}
        <FormControl isRequired>
          <FormLabel {...label}>Code from your authenticator app</FormLabel>
          <Input {...codeInput} value={code} onChange={(e) => setCode(e.target.value)} autoFocus={mode === 'regenerate'} />
          {mode === 'disable' && <FormHelperText fontSize="xs">A recovery code works too.</FormHelperText>}
          {mode === 'regenerate' && <FormHelperText fontSize="xs">Your current recovery codes will stop working.</FormHelperText>}
        </FormControl>
        <HStack>
          <Button type="submit" colorScheme={mode === 'disable' ? 'red' : 'brand'} isLoading={busy}>
            {mode === 'disable' ? 'Turn off' : 'Make new codes'}
          </Button>
          {cancel}
        </HStack>
      </VStack>
    );
  } else if (enabled) {
    const left = account.recoveryCodesLeft ?? 0;
    body = (
      <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'start', sm: 'center' }} spacing={4}>
        <Box>
          <Text color="fg.default">On since {formatDate(account.twoFactorEnabledAt!)}.</Text>
          <Text fontSize="sm" color={left <= 3 ? 'orange.500' : 'fg.muted'}>
            {left} of 10 recovery codes left{left <= 3 ? ', so make new ones soon.' : '.'}
          </Text>
        </Box>
        <HStack flexShrink={0}>
          <Button size="sm" variant="outline" onClick={() => setMode('regenerate')}>
            New recovery codes
          </Button>
          <Button size="sm" variant="outline" colorScheme="red" onClick={() => setMode('disable')}>
            Turn off
          </Button>
        </HStack>
      </Stack>
    );
  } else {
    body = (
      <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'start', sm: 'center' }} spacing={4}>
        <Text fontSize="sm" color="fg.muted" maxW="lg">
          Ask for a code from your phone after your password, so a leaked password alone can’t get into the Admin area.
        </Text>
        <Button colorScheme="brand" size="sm" flexShrink={0} onClick={startSetup} isLoading={busy}>
          Set up
        </Button>
      </Stack>
    );
  }

  return (
    <Box p={6} bg="bg.surface" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="border.default" gridColumn={{ lg: '1 / -1' }}>
      <Flex align="center" gap={2} mb={4}>
        <Heading as="h2" size="sm" color="fg.default">
          Two-Step Verification
        </Heading>
        {account && <Badge colorScheme={enabled ? 'green' : 'gray'}>{enabled ? 'On' : 'Off'}</Badge>}
      </Flex>
      {body}
    </Box>
  );
}
