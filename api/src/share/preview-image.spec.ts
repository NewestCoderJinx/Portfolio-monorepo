import { describe, expect, it } from 'vitest';
import { imageVersion } from './share.controller';
import { buildPreviewSvg, PREVIEW_HEIGHT, PREVIEW_WIDTH, renderPreviewPng, textWidth, wrapText } from './preview-image';

describe('wrapText', () => {
  it('keeps short text on one line', () => {
    expect(wrapText('Queue Service', 64, 1040, 3, true)).toEqual(['Queue Service']);
  });

  it('wraps at word boundaries within the width', () => {
    const lines = wrapText('one two three four five six seven eight nine ten', 30, 300, 5);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(textWidth(l, 30)).toBeLessThanOrEqual(300);
    expect(lines.join(' ')).toBe('one two three four five six seven eight nine ten');
  });

  it('stops at the line limit and ends with an ellipsis', () => {
    const lines = wrapText('word '.repeat(200), 30, 300, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(textWidth(lines[1], 30)).toBeLessThanOrEqual(300);
  });

  it('cuts a single word that is wider than the line', () => {
    const [line] = wrapText('x'.repeat(500), 30, 300, 1);
    expect(textWidth(line, 30)).toBeLessThanOrEqual(300);
  });
});

describe('buildPreviewSvg', () => {
  it('escapes user text', () => {
    const svg = buildPreviewSvg({ title: '<script>&"', tags: ['C++ & <Go>'], name: 'A & B' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;&amp;&quot;');
    expect(svg).toContain('C++ &amp; &lt;Go&gt;');
    expect(svg).toContain('A &amp; B');
  });

  it('shows at most four tags and skips blank ones', () => {
    const svg = buildPreviewSvg({ title: 'T', tags: ['a', ' ', 'b', 'c', 'd', 'e'] });
    expect(svg.match(/<rect x="\d+" y="470"/g)).toHaveLength(3);
  });

  it('leaves out the footer without a name', () => {
    expect(buildPreviewSvg({ title: 'T', headline: 'Engineer' })).not.toContain('Engineer');
  });
});

describe('preview label', () => {
  it('says Case study by default and takes a custom label', () => {
    expect(buildPreviewSvg({ title: 'T' })).toContain('>CASE STUDY</text>');
    expect(buildPreviewSvg({ title: 'T', kicker: 'Blog post' })).toContain('>BLOG POST</text>');
  });
});

describe('renderPreviewPng', () => {
  it('renders a 1200×630 PNG with the bundled fonts', () => {
    const png = renderPreviewPng({ title: 'Queue Service', description: 'Handles jobs.', tags: ['Go'], name: 'Ada' });
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(PREVIEW_WIDTH);
    expect(png.readUInt32BE(20)).toBe(PREVIEW_HEIGHT);
  });
});

describe('imageVersion', () => {
  it('follows the most recent edit of the project or profile', () => {
    const older = new Date('2026-01-01');
    const newer = new Date('2026-02-01');
    expect(imageVersion({ updatedAt: newer }, { updatedAt: older })).toBe(imageVersion({ updatedAt: older }, { updatedAt: newer }));
    expect(imageVersion({ updatedAt: older }, null)).not.toBe(imageVersion({ updatedAt: newer }, null));
  });
});
