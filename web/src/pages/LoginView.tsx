import { useState, type FormEvent } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Button,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { login, setToken } from '../api/auth';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      setToken(data.access_token);
      toast({ title: 'Logged in successfully', status: 'success', duration: 3000, isClosable: true });
      navigate('/admin');
    } catch (err) {
      toast({
        title: 'Authentication failed',
        description: 'Invalid credentials provided',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" py={20}>
      <Container maxW="sm">
        <VStack spacing={6}>
          <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
            Admin Access
          </Badge>
          <Heading size="lg">Portfolio Admin Login</Heading>

          <Box
            as="form"
            onSubmit={handleLogin}
            w="full"
            p={8}
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <VStack spacing={4}>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
              />
              <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
                Sign In
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}