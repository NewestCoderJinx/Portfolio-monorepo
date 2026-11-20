import { useEffect, useState } from 'react';
import { Box, Button, Container, Flex, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Text, useColorMode } from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { getExperience } from '../api/experience';
import { getPosts } from '../api/posts';
import { getProfile } from '../api/profile';
import { MenuIcon, MoonIcon, SunIcon } from './public/icons';
import { scrollBehavior } from '../motion';

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
  const [hasPosts, setHasPosts] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    getProfile()
      .then((p) => {
        setBrand(p?.name || 'Portfolio');
        setHasContact(Boolean(p)); // the contact form shows whenever a profile exists
      })
      .catch(() => setBrand('Portfolio'));
    getExperience()
      .then((list) => setHasExperience(list.length > 0))
      .catch(() => setHasExperience(false));
    getPosts()
      .then((list) => setHasPosts(list.length > 0))
      .catch(() => setHasPosts(false));
  }, []);

  // Only link to sections that will actually render.
  const sections = SECTIONS.filter(
    (s) => (s.hash !== '#contact' || hasContact) && (s.hash !== '#experience' || hasExperience),
  );

  // From another page the link navigates and PublicView scrolls once it has rendered. On the home page the
  // hash may not change (a second click), so scroll here too.
  const goToSection = (hash: string) => {
    if (pathname === '/') document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <Box
      as="header"
      className="app-navbar"
      bg="bg.navbar"
      backdropFilter="saturate(180%) blur(8px)"
      borderBottomWidth="1px"
      borderColor="border.default"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Container maxW="container.lg" py={2.5}>
        <Flex align="center" justify="space-between" gap={4}>
          <Text
            as={RouterLink}
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
            fontSize="lg"
            fontWeight="bold"
            color="fg.brand"
            noOfLines={1}
            minW={0}
          >
            {brand ?? ' '}
          </Text>

          <HStack as="nav" aria-label="Main" spacing={{ base: 1, md: 2 }} flexShrink={0}>
            {/* Tablet and up: every link in the bar, with Contact as the main action. */}
            {sections.map((s) => (
              <Button
                key={s.hash}
                as={RouterLink}
                to={{ pathname: '/', hash: s.hash }}
                variant={s.hash === '#contact' && !isAuth ? 'outline' : 'ghost'}
                colorScheme={s.hash === '#contact' && !isAuth ? 'brand' : undefined}
                size="sm"
                onClick={() => goToSection(s.hash)}
                display={{ base: 'none', md: 'inline-flex' }}
                order={s.hash === '#contact' ? 1 : 0}
              >
                {s.label}
              </Button>
            ))}

            {hasPosts && (
              <Button
                as={RouterLink}
                to="/blog"
                variant="ghost"
                size="sm"
                aria-current={pathname.startsWith('/blog') ? 'page' : undefined}
                color={pathname.startsWith('/blog') ? 'fg.brand' : undefined}
                bg={pathname.startsWith('/blog') ? 'bg.brandSubtle' : undefined}
                display={{ base: 'none', md: 'inline-flex' }}
              >
                Blog
              </Button>
            )}

            <IconButton
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
              icon={isDark ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              order={2}
            />

            {/* Phones: the same links in a menu, so the bar never overflows. */}
            {(sections.length > 0 || hasPosts) && (
              <Box display={{ base: 'block', md: 'none' }} order={3}>
                <Menu placement="bottom-end">
                  <MenuButton as={IconButton} aria-label="Open menu" icon={<MenuIcon width={18} height={18} />} variant="ghost" size="sm" />
                  <MenuList minW="44">
                    {sections.map((s) => (
                      <MenuItem key={s.hash} as={RouterLink} to={{ pathname: '/', hash: s.hash }} onClick={() => goToSection(s.hash)}>
                        {s.label}
                      </MenuItem>
                    ))}
                    {hasPosts && (
                      <MenuItem as={RouterLink} to="/blog">
                        Blog
                      </MenuItem>
                    )}
                  </MenuList>
                </Menu>
              </Box>
            )}

            {isAuth && (
              <>
                <Button
                  as={RouterLink}
                  to="/admin"
                  size="sm"
                  variant={pathname === '/admin' ? 'solid' : 'ghost'}
                  colorScheme="brand"
                  order={4}
                >
                  Dashboard
                </Button>
                <Button size="sm" variant="outline" colorScheme="red" onClick={handleLogout} order={5}>
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
