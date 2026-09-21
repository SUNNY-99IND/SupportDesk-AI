import dns from 'node:dns/promises';
import { AppError } from './AppError';

export interface ValidatedUrlResult {
  normalizedUrl: string;
  hostname: string;
  isReachable: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Checks if an IPv4 address falls within private, loopback, link-local, or reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [a, b] = parts as [number, number, number, number];

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link-local)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  // 192.0.2.0/24 (Documentation - TEST-NET-1)
  if (a === 192 && b === 0) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  // 198.51.100.0/24 (Documentation - TEST-NET-2)
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;

  // 203.0.113.0/24 (Documentation - TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast: 224 - 239)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved for future use: 240 - 255)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls within private, loopback, or reserved ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 (Loopback)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // :: (Unspecified)
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // fe80::/10 (Link-local unicast)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // fc00::/7 (Unique local address)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // ff00::/8 (Multicast)
  if (normalized.startsWith('ff')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    return isPrivateOrReservedIPv4(ipv4Part);
  }

  return false;
}

/**
 * Normalizes a user-supplied URL to a standardized string.
 * Example: "HTTP://WWW.Example.COM:80/path/" -> "http://www.example.com/path"
 */
export function normalizeWebsiteUrl(rawUrl: string): { normalizedUrl: string; hostname: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new AppError('Please enter a valid website URL.', 400);
  }

  // If no scheme is present (e.g., example.com), prepend https://.
  // Preserve existing schemes like file://, javascript:, ftp:// so they are caught and rejected below.
  let withProtocol = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    withProtocol = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new AppError('Please enter a valid website URL.', 400);
  }

  // Strictly enforce http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError('Only standard web URLs (http:// or https://) are supported.', 400);
  }

  // Reject credentials in URL
  if (parsed.username || parsed.password) {
    throw new AppError('URLs with embedded credentials are not permitted.', 400);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject local and internal hostnames (SSRF protection)
  const forbiddenHosts = ['localhost', 'broadcasthost', 'local', 'internal', 'lan', 'corp', 'home', 'intranet'];
  if (forbiddenHosts.includes(hostname) || forbiddenHosts.some((h) => hostname.endsWith(`.${h}`))) {
    throw new AppError('This website address cannot be used. Please enter a publicly accessible website.', 400);
  }

  // Basic format rejection (e.g. "hello", "abc")
  if (!hostname.includes('.')) {
    throw new AppError('Please enter a valid website domain (e.g., https://example.com).', 400);
  }

  // Strip default ports
  if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
    parsed.port = '';
  }

  // Build clean normalized URL (remove trailing slash for base website representation)
  let normalizedPath = parsed.pathname;
  if (normalizedPath === '/') {
    normalizedPath = '';
  } else if (normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  const normalizedUrl = `${parsed.protocol}//${parsed.host}${normalizedPath}${parsed.search}`;
  return { normalizedUrl, hostname };
}

/**
 * Resolves DNS for the hostname and ensures NO resolved IP is private or local (SSRF protection).
 */
export async function verifyDnsAndSsrfSafety(hostname: string): Promise<string[]> {
  // If the hostname itself is a raw IP literal
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isPrivateOrReservedIPv4(hostname)) {
      throw new AppError('This website address cannot be used. Please enter a publicly accessible website.', 400);
    }
    return [hostname];
  }

  if (hostname.includes(':')) {
    if (isPrivateOrReservedIPv6(hostname)) {
      throw new AppError('This website address cannot be used. Please enter a publicly accessible website.', 400);
    }
    return [hostname];
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (err: any) {
    throw new AppError(`We couldn't resolve the domain '${hostname}'. Please check the URL and try again.`, 400);
  }

  if (!addresses || addresses.length === 0) {
    throw new AppError(`Website could not be verified. DNS lookup returned no addresses.`, 400);
  }

  const resolvedIps: string[] = [];
  for (const item of addresses) {
    const ip = item.address;
    resolvedIps.push(ip);

    if (item.family === 4 && isPrivateOrReservedIPv4(ip)) {
      throw new AppError('This website address cannot be used. Please enter a publicly accessible website.', 400);
    }
    if (item.family === 6 && isPrivateOrReservedIPv6(ip)) {
      throw new AppError('This website address cannot be used. Please enter a publicly accessible website.', 400);
    }
  }

  return resolvedIps;
}

/**
 * Validates a website URL completely:
 * 1. Syntax format & normalization
 * 2. DNS resolution + SSRF protection
 * 3. Network reachability check via HTTP GET/HEAD
 */
export async function validateAndReachWebsite(rawUrl: string): Promise<ValidatedUrlResult> {
  const { normalizedUrl, hostname } = normalizeWebsiteUrl(rawUrl);

  // 1. DNS & SSRF protection
  await verifyDnsAndSsrfSafety(hostname);

  // 2. HTTP Reachability probe
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SupportDesk-AI-Bot/1.0 (+https://supportdesk.ai; Website Verification)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    // Any HTTP status < 500 confirms a reachable, functioning web server
    if (res.status >= 500) {
      throw new AppError(`Website server returned an error (HTTP ${res.status}). Please verify your website is online.`, 400);
    }

    return {
      normalizedUrl,
      hostname,
      isReachable: true,
      statusCode: res.status,
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new AppError('Website could not be reached within the timeout period. Please check the URL and try again.', 400);
    }
    throw new AppError(`We couldn't reach this website (${err.message || 'connection failed'}). Please check the URL and try again.`, 400);
  }
}

/**
 * Verifies that a target website contains the unique SupportDesk verification meta tag or token.
 */
export async function verifyWebsiteOwnershipToken(
  websiteUrl: string,
  verificationToken: string
): Promise<{ verified: boolean; message: string }> {
  const { normalizedUrl, hostname } = normalizeWebsiteUrl(websiteUrl);
  await verifyDnsAndSsrfSafety(hostname);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SupportDesk-AI-Verifier/1.0 (+https://supportdesk.ai)',
        Accept: 'text/html,text/plain,*/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        verified: false,
        message: `Website returned HTTP status ${res.status}. Could not inspect verification tag.`,
      };
    }

    const html = await res.text();

    // Check for meta tag: <meta name="supportdesk-verification" content="TOKEN">
    const metaRegex = new RegExp(
      `<meta[^>]+name=["']supportdesk-verification["'][^>]+content=["']${verificationToken}["']`,
      'i'
    );
    const metaRegexAlt = new RegExp(
      `<meta[^>]+content=["']${verificationToken}["'][^>]+name=["']supportdesk-verification["']`,
      'i'
    );

    if (metaRegex.test(html) || metaRegexAlt.test(html) || html.includes(verificationToken)) {
      return {
        verified: true,
        message: 'Website ownership successfully verified via meta tag.',
      };
    }

    return {
      verified: false,
      message: `Verification token not found on ${normalizedUrl}. Please ensure <meta name="supportdesk-verification" content="${verificationToken}"> is present in the <head> section.`,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: `Failed to inspect website: ${err.message || 'Connection error'}.`,
    };
  }
}
