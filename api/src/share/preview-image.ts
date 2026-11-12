import { Resvg } from '@resvg/resvg-js';
import { join } from 'path';

/** The size LinkedIn, X, Slack and WhatsApp all crop well. */
export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 630;

// Bundled so the image looks the same everywhere (the Alpine image has no fonts). Resolves from src/ and dist/.
const FONT_DIR = join(__dirname, '..', '..', 'assets', 'fonts');
const FONT_FILES = [join(FONT_DIR, 'Inter-Regular.ttf'), join(FONT_DIR, 'Inter-Bold.ttf')];

// The site's brand and accent palette (web/src/theme.ts).
const COLORS = {
  bgFrom: '#0b1838',
  bgTo: '#1f4290',
  title: '#ffffff',
  text: '#d3dff5',
  muted: '#a8bfeb',
  accent: '#5eead4',
  accentStrong: '#2dd4bf',
};

export interface PreviewContent {
  title: string;
  description?: string | null;
  tags?: string[] | null;
  /** Owner name, shown in the footer. */
  name?: string | null;
  headline?: string | null;
  /** Small label above the title. Defaults to "Case study". */
  kicker?: string;
}

const PAD_X = 80;
const MAX_TEXT_WIDTH = PREVIEW_WIDTH - PAD_X * 2;

const escapeXml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Rough Inter advance widths (in em). Good enough to wrap lines without a text-shaping engine. */
function charWidth(ch: string): number {
  if (' .,:;|!\'`il'.includes(ch)) return 0.28;
  if ('fjrtI()[]'.includes(ch)) return 0.36;
  if ('mwMW@'.includes(ch)) return 0.88;
  if (/[A-Z]/.test(ch)) return 0.7;
  if (/[0-9]/.test(ch)) return 0.6;
  if (/[a-z]/.test(ch)) return 0.56;
  return 0.65; // punctuation, symbols, other scripts
}

export function textWidth(text: string, fontSize: number, bold = false): number {
  let em = 0;
  for (const ch of text) em += charWidth(ch);
  return em * fontSize * (bold ? 1.06 : 1);
}

/** Trims a line until it (plus an ellipsis) fits. */
function ellipsize(line: string, fontSize: number, bold: boolean, maxWidth: number): string {
  let out = line.trimEnd();
  while (out && textWidth(`${out}…`, fontSize, bold) > maxWidth) out = out.slice(0, -1).trimEnd();
  return `${out}…`;
}

/** Greedy word wrap into at most maxLines lines; the last line gets an ellipsis if text remains. */
export function wrapText(text: string, fontSize: number, maxWidth: number, maxLines: number, bold = false): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let i = 0;
  for (; i < words.length; i++) {
    let word = words[i];
    // A single word wider than the line is cut rather than overflowing.
    if (textWidth(word, fontSize, bold) > maxWidth) word = ellipsize(word, fontSize, bold, maxWidth).slice(0, -1);
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, fontSize, bold) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
    current = '';
  }
  const truncated = i < words.length;
  if (truncated && lines.length) lines[lines.length - 1] = ellipsize(lines[lines.length - 1], fontSize, bold, maxWidth);
  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, attrs: string): string {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${escapeXml(l)}</text>`).join('\n  ');
}

/** The preview card as SVG: label, title, description, tags and an owner footer. */
export function buildPreviewSvg(c: PreviewContent): string {
  const parts: string[] = [];
  let y = 150;

  parts.push(
    `<text x="${PAD_X}" y="${y}" font-size="24" font-weight="700" letter-spacing="4" fill="${COLORS.accent}">${escapeXml((c.kicker ?? 'Case study').toUpperCase())}</text>`,
  );
  y += 80;

  const titleSize = c.title.length > 60 ? 54 : 64;
  const titleLineHeight = Math.round(titleSize * 1.18);
  const title = wrapText(c.title, titleSize, MAX_TEXT_WIDTH, 3, true);
  parts.push(textLines(title, PAD_X, y, titleLineHeight, `font-size="${titleSize}" font-weight="700" fill="${COLORS.title}"`));
  y += (title.length - 1) * titleLineHeight + 62;

  // Fewer description lines when the title is long, so nothing collides with the tags.
  const descLines = title.length >= 3 ? 1 : 2;
  const description = c.description ? wrapText(c.description, 30, MAX_TEXT_WIDTH, descLines) : [];
  if (description.length) {
    parts.push(textLines(description, PAD_X, y, 42, `font-size="30" fill="${COLORS.text}"`));
  }

  // Tags: as many pills as fit on one row, up to four.
  const tagY = 470;
  let x = PAD_X;
  for (const raw of (c.tags ?? []).slice(0, 4)) {
    const tag = raw.trim();
    if (!tag) continue;
    const label = tag.length > 24 ? `${tag.slice(0, 23)}…` : tag;
    const w = Math.round(textWidth(label, 22) + 36);
    if (x + w > PREVIEW_WIDTH - PAD_X) break;
    parts.push(
      `<rect x="${x}" y="${tagY}" width="${w}" height="44" rx="22" fill="${COLORS.accentStrong}" fill-opacity="0.14" stroke="${COLORS.accent}" stroke-opacity="0.6"/>`,
      `<text x="${x + 18}" y="${tagY + 29}" font-size="22" fill="${COLORS.accent}">${escapeXml(label)}</text>`,
    );
    x += w + 12;
  }

  if (c.name) {
    const nameWidth = textWidth(c.name, 28, true);
    const rest = c.headline ? `  ·  ${c.headline}` : '';
    const restFits = rest ? ellipsizeIfNeeded(rest, 28, MAX_TEXT_WIDTH - nameWidth) : '';
    parts.push(
      `<text x="${PAD_X}" y="572" font-size="28"><tspan font-weight="700" fill="${COLORS.title}">${escapeXml(c.name)}</tspan>` +
        (restFits ? `<tspan fill="${COLORS.muted}">${escapeXml(restFits)}</tspan>` : '') +
        `</text>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PREVIEW_WIDTH}" height="${PREVIEW_HEIGHT}" viewBox="0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}" font-family="Inter">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.bgFrom}"/>
      <stop offset="1" stop-color="${COLORS.bgTo}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${PREVIEW_WIDTH - 40}" cy="40" r="260" fill="${COLORS.accentStrong}" fill-opacity="0.08"/>
  <circle cx="${PREVIEW_WIDTH - 40}" cy="40" r="160" fill="${COLORS.accentStrong}" fill-opacity="0.08"/>
  <rect x="0" y="${PREVIEW_HEIGHT - 10}" width="${PREVIEW_WIDTH}" height="10" fill="${COLORS.accentStrong}"/>
  ${parts.join('\n  ')}
</svg>`;
}

function ellipsizeIfNeeded(text: string, fontSize: number, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  return textWidth(text, fontSize) <= maxWidth ? text : ellipsize(text, fontSize, false, maxWidth);
}

/** Renders the card to PNG with the bundled Inter fonts (system fonts are ignored for consistent output). */
export function renderPreviewPng(c: PreviewContent): Buffer {
  const resvg = new Resvg(buildPreviewSvg(c), {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' },
    fitTo: { mode: 'original' },
  });
  return resvg.render().asPng();
}
