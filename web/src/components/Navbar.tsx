import { useEffect, useState } from 'react';
import { Box, Button, Container, Flex, HStack, IconButton, Text, useColorMode } from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { getExperience } from '../api/experience';
import { getProfile } from '../api/profile';
import { MoonIcon, SunIcon } from './public/icons';

interface NavbarProps {
  isAuth: boolean;
  onLogout: () => void;
}

const SECTIONS = [
  { label: 'Projects', hash: '#projects' },
  { label: 'Experience', hash: '#experience' },
  { label: 'Contact', hash: '#contact' },
];

export function Navbar({ isAuth, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [brand, setBrand] = useState<string | null>(null);
  const [hasContact, setHasContact] = useState(false);
  const [hasExperience, setHasExperience] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    getProfile()
      .then((p) => {
        setBrand(p?.name || 'Portfolio');
        setHasContact(Boolean(p && (p.email || p.githubUrl || p.linkedinUrl || p.websiteUrl || p.resumeUrl)));
      })
      .catch(() => setBrand('Portfolio'));
    getExperience()
      .then((list) => setHasExperience(list.length > 0))
      .catch(() => setHasExperience(false));
  }, []);

  // Only link to sections that will actually render.
  const sections = SECTIONS.filter(
    (s) => (s.hash !== '#contact' || hasContact) && (s.hash !== '#experience' || hasExperience),
  );

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
      bg="bg.navbar"
      backdropFilter="saturate(180%) blur(8px)"
      borderBottomWidth="1px"
      borderColor="border.default"
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
            color="fg.brand"
            noOfLines={1}
            minW={0}
          >
            {brand ?? ' '}
          </Text>

          <HStack as="nav" spacing={{ base: 1, md: 2 }} flexShrink={0}>
            {sections.map((s) => (
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

            <IconButton
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
              icon={isDark ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
            />

            {isAuth && (
              <>
                <Button
                  as={RouterLink}
                  to="/admin"
                  size="sm"
                  variant={pathname === '/admin' ? 'solid' : 'ghost'}
                  colorScheme="brand"
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
