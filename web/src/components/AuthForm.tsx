import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react';
import { loginUser, registerUser } from '../api/auth';

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.50" minH="calc(100vh - 80px)" py={12} display="flex" alignItems="center">
      <Container maxW="md">
        <Card borderWidth="1px" borderColor="gray.200" borderRadius="xl" boxShadow="sm" bg="white">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              
              {/* Header Badge & Title */}
              <VStack spacing={2} textAlign="center">
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
                  Admin Access
                </Badge>
                <Heading size="lg" color="gray.800" letterSpacing="tight">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {isLogin
                    ? 'Enter your credentials to access the project dashboard'
                    : 'Register an account to manage portfolio projects'}
                </Text>
              </VStack>

              {/* Error Message */}
              {error && (
                <Alert status="error" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Form */}
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                      Email Address
                    </FormLabel>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      borderRadius="md"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                      Password
                    </FormLabel>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      borderRadius="md"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    mt={2}
                    isLoading={loading}
                    loadingText={isLogin ? 'Signing in...' : 'Registering...'}
                  >
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                </VStack>
              </Box>

              {/* Switch between Login and Register */}
              <Box textAlign="center" pt={2}>
                <Button
                  variant="link"
                  colorScheme="blue"
                  fontSize="sm"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </Button>
              </Box>

            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};