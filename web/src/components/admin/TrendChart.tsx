import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Box, Button, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, useColorMode, useColorModeValue, useToken } from '@chakra-ui/react';

export interface TrendSeries {
  label: string;
  values: number[];
  /** Chakra color tokens for light and dark mode (validated against each surface). */
  color: { light: string; dark: string };
}

const HEIGHT = 200;
const M = { top: 12, right: 44, bottom: 26, left: 36 };

/** "Nov 10" from YYYY-MM-DD, read as a UTC date so it never shifts by a day. */
const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A round axis maximum (1, 2, 5 × 10ⁿ steps) with four intervals. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough)!;
  const nice = Math.max(1, step);
  return { top: Math.ceil(max / nice) * nice, step: nice };
}

/**
 * Daily counts as lines on one axis, with a legend, end-of-line values, a crosshair tooltip
 * (pointer or arrow keys) and a table view, so no value depends on hovering or on color.
 */
export function TrendChart({ days, series, ariaLabel }: { days: string[]; series: TrendSeries[]; ariaLabel: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { colorMode } = useColorMode();
  const colors = useToken('colors', series.map((s) => (colorMode === 'dark' ? s.color.dark : s.color.light)));
  const [grid, axisText, surface] = useToken('colors', [
    useColorModeValue('gray.200', 'gray.700'),
    useColorModeValue('gray.500', 'gray.400'),
    useColorModeValue('white', 'gray.800'),
  ]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = days.length;
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const { top, step } = niceScale(max);
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const x = (i: number) => M.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const xTicks = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [...Array(n).keys()];

  const paths = series.map((s) => s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''));

  // End-of-line values only when they don't collide; otherwise the legend and tooltip carry them.
  const endYs = series.map((s) => y(s.values[n - 1] ?? 0));
  const endLabels = endYs.every((a, i) => endYs.every((b, j) => i === j || Math.abs(a - b) >= 14));

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - box.left) / box.width;
    setActive(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  };

  const onKey = (e: KeyboardEvent<SVGRectElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    setActive((cur) => {
      if (e.key === 'Home') return 0;
      if (e.key === 'End') return n - 1;
      const from = cur ?? n - 1;
      return Math.min(n - 1, Math.max(0, from + (e.key === 'ArrowLeft' ? -1 : 1)));
    });
  };

  // Beside the crosshair (never over the hovered points), flipping to the left near the right edge.
  const TOOLTIP_W = 190;
  const tooltipLeft = active === null ? 0 : x(active) + 12 + TOOLTIP_W <= width ? x(active) + 12 : Math.max(0, x(active) - 12 - TOOLTIP_W);

  return (
    <Box>
      <HStack spacing={4} mb={2} flexWrap="wrap" as="ul" listStyleType="none" aria-label="Legend">
        {series.map((s, i) => (
          <HStack as="li" key={s.label} spacing={1.5} fontSize="xs" color="fg.secondary">
            <Box w="14px" h="2px" bg={colors[i]} borderRadius="1px" />
            <Text>{s.label}</Text>
          </HStack>
        ))}
      </HStack>

      <Box ref={wrapRef} position="relative">
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel} style={{ display: 'block', overflow: 'visible' }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke={grid} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={axisText} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t.toLocaleString()}
              </text>
            </g>
          ))}
          {xTicks.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor={k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'}
              fontSize="11"
              fill={axisText}
            >
              {shortDay(days[i])}
            </text>
          ))}

          {paths.map((d, i) => (
            <path key={series[i].label} d={d} fill="none" stroke={colors[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {endLabels &&
            series.map((s, i) => (
              <text key={s.label} x={x(n - 1) + 8} y={endYs[i]} dy="0.32em" fontSize="11" fontWeight="600" fill={axisText}>
                {(s.values[n - 1] ?? 0).toLocaleString()}
              </text>
            ))}

          {active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + plotH} stroke={axisText} strokeWidth={1} />
              {series.map((s, i) => (
                <circle key={s.label} cx={x(active)} cy={y(s.values[active] ?? 0)} r={4} fill={colors[i]} stroke={surface} strokeWidth={2} />
              ))}
            </g>
          )}

          {/* Hit area covers the whole plot, so the pointer only has to be near a day. */}
          <rect
            x={M.left}
            y={M.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            aria-label={`${ariaLabel}. Use the left and right arrow keys to read each day.`}
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive((cur) => cur ?? n - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={onKey}
            style={{ outline: 'none', cursor: 'crosshair' }}
          />
        </svg>

        {active !== null && (
          <Box
            position="absolute"
            top={0}
            left={`${tooltipLeft}px`}
            w={`${TOOLTIP_W}px`}
            pointerEvents="none"
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="md"
            boxShadow="md"
            px={3}
            py={2}
            role="status"
            aria-live="polite"
          >
            <Text fontSize="xs" color="fg.muted" mb={1}>
              {shortDay(days[active])}
            </Text>
            {series.map((s, i) => (
              <HStack key={s.label} spacing={2} fontSize="sm">
                <Box w="10px" h="2px" bg={colors[i]} flexShrink={0} />
                <Text fontWeight="bold" color="fg.heading" minW="2ch">
                  {(s.values[active] ?? 0).toLocaleString()}
                </Text>
                <Text color="fg.secondary" fontSize="xs" whiteSpace="nowrap">
                  {s.label}
                </Text>
              </HStack>
            ))}
          </Box>
        )}
      </Box>

      <Button size="xs" variant="link" colorScheme="gray" mt={2} onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
        {showTable ? 'Hide table' : 'Show as table'}
      </Button>
      {showTable && (
        <Box maxH="240px" overflowY="auto" mt={2} borderWidth="1px" borderColor="border.subtle" borderRadius="md">
          <Table size="sm">
            <Thead position="sticky" top={0} bg="bg.surface">
              <Tr>
                <Th>Day</Th>
                {series.map((s) => (
                  <Th key={s.label} isNumeric>
                    {s.label}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {[...days.keys()].reverse().map((i) => (
                <Tr key={days[i]}>
                  <Td>{shortDay(days[i])}</Td>
                  {series.map((s) => (
                    <Td key={s.label} isNumeric style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {(s.values[i] ?? 0).toLocaleString()}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
