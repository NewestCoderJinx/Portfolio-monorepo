import { Box, HStack, Text, useColorModeValue, useToken } from '@chakra-ui/react';

const W = 96;
const H = 24;

/**
 * A tiny 30-day trend for one series. Decorative: the total beside it carries the value,
 * and the Overview chart has the per-day detail and table.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const [stroke, dot, surface] = useToken('colors', [
    useColorModeValue('brand.500', 'brand.400'),
    useColorModeValue('brand.500', 'brand.400'),
    useColorModeValue('white', 'gray.800'),
  ]);
  const total = values.reduce((a, b) => a + b, 0);
  if (values.length < 2 || total === 0) return null;

  const max = Math.max(...values);
  const pad = 3; // room for the end dot and its ring
  const x = (i: number) => pad + (i / (values.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (H - pad * 2) * (1 - v / max);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = values.length - 1;

  return (
    <HStack spacing={2} title={`${total} ${label} in the last ${values.length} days`}>
      <Box as="svg" width={`${W}px`} height={`${H}px`} aria-hidden flexShrink={0}>
        <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last)} cy={y(values[last])} r={2.5} fill={dot} stroke={surface} strokeWidth={1.5} />
      </Box>
      <Text fontSize="xs" color="fg.muted">
        {total} in {values.length} days
      </Text>
    </HStack>
  );
}
