/** Updates (or creates) a <meta> tag at runtime, for crawlers that run JavaScript (e.g. Google). */
export function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.dataset.runtime = '';
    document.head.appendChild(el);
  } else if (el.dataset.static === undefined && el.dataset.runtime === undefined) {
    el.dataset.static = el.content; // remember the build-time value so it can be restored
  }
  el.content = content;
}

/** Puts a tag back to its build-time value, or removes it if it only ever existed at runtime. */
export function resetMeta(attr: 'name' | 'property', key: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) return;
  if (el.dataset.static !== undefined) el.content = el.dataset.static;
  else if (el.dataset.runtime !== undefined) el.remove();
}

/** First sentence-ish of a text, capped for search snippets. */
export function summarize(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

export interface PageMeta {
  title: string;
  description?: string | null;
  /** Absolute or site-relative; made absolute because previews require it. */
  image?: string | null;
  url?: string;
}

/** Sets the document title plus the matching description, Open Graph and Twitter tags. */
export function applyPageMeta({ title, description, image, url }: PageMeta) {
  document.title = title;
  setMeta('property', 'og:title', title);
  setMeta('name', 'twitter:title', title);
  if (description) {
    const summary = summarize(description);
    setMeta('name', 'description', summary);
    setMeta('property', 'og:description', summary);
    setMeta('name', 'twitter:description', summary);
  }
  if (image) {
    const absolute = new URL(image, window.location.href).href;
    setMeta('property', 'og:image', absolute);
    setMeta('name', 'twitter:image', absolute);
    setMeta('name', 'twitter:card', 'summary_large_image');
  } else {
    resetMeta('property', 'og:image');
    resetMeta('name', 'twitter:image');
    resetMeta('name', 'twitter:card');
  }
  if (url) setMeta('property', 'og:url', url);
}

/** Replaces (or adds) one JSON-LD block in <head>, identified by id. null removes it. */
export function setJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const el = existing ?? Object.assign(document.createElement('script'), { id, type: 'application/ld+json' });
  // "<" is escaped so a value containing "</script>" can't end the block early.
  el.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  if (!existing) document.head.appendChild(el);
}
