import { useEffect, useState } from 'react';
import { Box, Button, Container, Flex, HStack, Text } from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { getProfile } from '../api/profile';

interface NavbarProps {
  isAuth: boolean;
  onLogout: () => void;
}

const SECTIONS = [
  { label: 'Projects', hash: '#projects' },
  { label: 'Contact', hash: '#contact' },
];

export function Navbar({ isAuth, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [brand, setBrand] = useState<string | null>(null);
  const [hasContact, setHasContact] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setBrand(p?.name || 'Portfolio');
        setHasContact(Boolean(p && (p.email || p.githubUrl || p.linkedinUrl || p.websiteUrl)));
      })
      .catch(() => setBrand('Portfolio'));
  }, []);

  const goToSection = (hash: string) => {
    // Works from any page: PublicView scrolls to the hash once it has rendered.
    navigate({ pathname: '/', hash });
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <Box
      as="header"
      bg="whiteAlpha.900"
      backdropFilter="saturate(180%) blur(8px)"
      borderBottomWidth="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Container maxW="container.lg" py={3}>
        <Flex align="center" justify="space-between" gap={4}>
          <Text
            as={RouterLink}
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            fontSize="lg"
            fontWeight="bold"
            color="blue.700"
            noOfLines={1}
            minW={0}
          >
            {brand ?? ' '}
          </Text>

          <HStack as="nav" spacing={{ base: 1, md: 2 }} flexShrink={0}>
            {SECTIONS.filter((s) => s.hash !== '#contact' || hasContact).map((s) => (
              <Button
                key={s.hash}
                variant="ghost"
                size="sm"
                onClick={() => goToSection(s.hash)}
                // Keep the bar uncluttered on phones when Dashboard/Logout are also shown
                display={{ base: isAuth ? 'none' : 'inline-flex', sm: 'inline-flex' }}
              >
                {s.label}
              </Button>
            ))}

            {isAuth && (
              <>
                <Button
                  as={RouterLink}
                  to="/admin"
                  size="sm"
                  variant={pathname === '/admin' ? 'solid' : 'ghost'}
                  colorScheme="blue"
                >
                  Dashboard
                </Button>
                <Button size="sm" variant="outline" colorScheme="red" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar;
