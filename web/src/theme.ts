import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// First visit follows the OS setting; after that the visitor's toggle choice is remembered.
const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: false,
};

/**
 * Palette: a deep navy brand, a teal accent and slate neutrals.
 * Components should use the semantic tokens below (bg.*, fg.*, border.*) rather than raw
 * palette steps, so every surface keeps its contrast if the color mode changes.
 */
const colors = {
  brand: {
    50: '#ecf1fb',
    100: '#d3dff5',
    200: '#a8bfeb',
    300: '#7699dc',
    400: '#4a74c9',
    500: '#2c56ad',
    600: '#1f4290',
    700: '#183373',
    800: '#122656',
    900: '#0b1838',
  },
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  // Slate: cooler, more refined neutrals than Chakra's default gray.
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

const semanticTokens = {
  colors: {
    'bg.canvas': { default: 'gray.50', _dark: 'gray.900' },
    'bg.surface': { default: 'white', _dark: 'gray.800' },
    'bg.subtle': { default: 'gray.50', _dark: 'whiteAlpha.50' },
    'bg.navbar': { default: 'rgba(255, 255, 255, 0.85)', _dark: 'rgba(15, 23, 42, 0.85)' },
    'bg.brandSubtle': { default: 'brand.50', _dark: 'rgba(118, 153, 220, 0.16)' },
    'border.default': { default: 'gray.200', _dark: 'whiteAlpha.200' },
    'border.subtle': { default: 'gray.100', _dark: 'whiteAlpha.100' },
    'border.strong': { default: 'gray.300', _dark: 'whiteAlpha.300' },
    'fg.default': { default: 'gray.700', _dark: 'gray.300' },
    'fg.heading': { default: 'gray.900', _dark: 'gray.50' },
    'fg.secondary': { default: 'gray.600', _dark: 'gray.400' },
    'fg.muted': { default: 'gray.500', _dark: 'gray.400' },
    'fg.subtle': { default: 'gray.400', _dark: 'gray.500' },
    'fg.brand': { default: 'brand.600', _dark: 'brand.200' },
    'fg.accent': { default: 'accent.700', _dark: 'accent.300' },
  },
};

const fontStack = `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

export const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  fonts: { heading: fontStack, body: fontStack },
  styles: {
    global: {
      body: { bg: 'bg.canvas', color: 'fg.default' },
      '::selection': { bg: 'accent.200', color: 'gray.900' },
    },
  },
  components: {
    Heading: { baseStyle: { color: 'fg.heading', letterSpacing: 'tight' } },
    Button: { baseStyle: { fontWeight: 'semibold', borderRadius: 'lg' } },
  },
});
