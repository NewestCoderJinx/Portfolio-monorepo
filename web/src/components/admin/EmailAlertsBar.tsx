import { useEffect, useState } from 'react';
import { Box, Button, HStack, Text, useToast } from '@chakra-ui/react';
import { getAlertStatus, sendTestAlert, type AlertStatus } from '../../api/messages';
import { apiErrorMessage } from '../../api/profile';

/** Shows whether new messages are emailed, and to where, with a way to send a test. */
export function EmailAlertsBar() {
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getAlertStatus()
      .then(setStatus)
      .catch(() => setStatus(null)); // the inbox works without it
  }, []);

  if (!status) return null;

  const test = async () => {
    setSending(true);
    try {
      const to = await sendTestAlert();
      toast({ title: 'Test email sent', description: `Check ${to} (and its spam folder).`, status: 'success', duration: 5000, isClosable: true });
    } catch (err) {
      toast({ title: 'Test email failed', description: apiErrorMessage(err, 'Please check the API’s SMTP settings.'), status: 'error', duration: 9000, isClosable: true });
    } finally {
      setSending(false);
    }
  };

  const ready = status.enabled && status.recipient;
  return (
    <Box px={4} py={3} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default">
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Text fontSize="sm" color="fg.secondary">
          <Text as="span" fontWeight="semibold" color={ready ? 'fg.heading' : 'fg.muted'}>
            Email alerts {ready ? 'on' : 'off'}
          </Text>
          {' · '}
          {ready
            ? `New messages are emailed to ${status.recipient}.`
            : status.enabled
              ? 'Add an email to your profile (or set NOTIFY_EMAIL on the API) to receive them.'
              : 'Set SMTP_HOST and related settings on the API to get an email for each new message.'}
        </Text>
        {ready && (
          <Button size="xs" variant="outline" onClick={test} isLoading={sending} loadingText="Sending">
            Send test email
          </Button>
        )}
      </HStack>
    </Box>
  );
}
