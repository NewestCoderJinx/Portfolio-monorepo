import { Box, Flex, Heading, Button, HStack, Container } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { isAuthenticated, logoutUser } from '../api/auth';

export function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" px={4} py={3} position="sticky" top={0} zIndex={100}>
      <Container maxW="container.lg">
        <Flex align="center" justify="space-between">
          <Heading
            as={RouterLink}
            to="/"
            size="md"
            color="blue.600"
            _hover={{ textDecoration: 'none' }}
          >
            DevPortfolio
          </Heading>

          <HStack spacing={4}>
            <Button as={RouterLink} to="/" variant="ghost" size="sm">
              Public View
            </Button>

            {loggedIn ? (
              <>
                <Button as={RouterLink} to="/admin" variant="ghost" size="sm">
                  Dashboard
                </Button>
                <Button colorScheme="red" variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button as={RouterLink} to="/login" colorScheme="blue" size="sm">
                Admin Login
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar;