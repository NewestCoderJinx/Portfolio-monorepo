/**
 * Link-preview fetchers and crawlers. They load share pages to build cards, so their visits
 * aren't clicks by people. Matched case-insensitively against the User-Agent.
 */
const BOT_PATTERN =
  /bot\b|bot\/|crawler|spider|preview|facebookexternalhit|facebookcatalog|whatsapp|slack|discord|telegram|linkedin|pinterest|embedly|skype|vkshare|redditbot|applebot|google-structured|headless|curl\/|wget\/|python-requests|go-http-client|node-fetch|axios\//i;

/** True for empty User-Agents and known bots/tools; real browsers always send one. */
export function isBot(userAgent: string | undefined): boolean {
  return !userAgent?.trim() || BOT_PATTERN.test(userAgent);
}
