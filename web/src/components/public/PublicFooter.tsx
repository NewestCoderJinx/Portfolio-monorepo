import { HStack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { isAuthenticated } from '../../api/auth';

export function PublicFooter({ name }: { name?: string }) {
  return (
    <HStack justify="center" spacing={3} fontSize="xs" color="gray.400">
      <Text>© {new Date().getFullYear()} {name ?? 'Portfolio'}</Text>
      {!isAuthenticated() && (
        <>
          <Text aria-hidden>·</Text>
          <Text as={RouterLink} to="/admin" _hover={{ color: 'gray.600' }}>
            Admin
          </Text>
        </>
      )}
    </HStack>
  );
}
