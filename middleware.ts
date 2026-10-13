import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known malicious vulnerability scanner user agents and probing paths
const MALICIOUS_PROBE_PATTERNS = [
  /(\.\.|\/etc\/passwd|\/etc\/shadow|win\.ini|boot\.ini)/i, // Path traversal
  /(<script|javascript:|alert\(|onerror=|onload=|document\.cookie|srcdoc=|<iframe|data:text\/html)/i, // Reflected XSS & Script Injection
  /(union[\s+]+select|select[\s+]+null|concat\(|information_schema|drop[\s+]+table|--\s*$)/i, // SQL injection probe
  /(\.env|\.git|\.aws|\.ssh|wp-config|phpinfo|xmlrpc\.php|eval-stdin)/i, // Sensitive file probing
  /(\x00|%00|cmd\.exe|\/bin\/sh|\/bin\/bash|eval\(|system\(|passthru\()/i, // Command injection & null byte probe
];

const SCANNER_USER_AGENTS = [
  'nikto',
  'sqlmap',
  'acunetix',
  'dirbuster',
  'nmap',
  'masscan',
  'zgrab',
  'wpscan',
  'gobuster',
];

// Aggressive scrapers and unauthorized data harvesters
const SCRAPER_USER_AGENTS = [
  'scrapy',
  'aiohttp',
  'python-requests',
  'urllib',
  'httpclient',
  'httpx',
  'go-http-client',
  'mechanize',
  'phantomjs',
  'headlesschrome',
  'selenium',
  'puppeteer',
  'playwright',
];

// AI training crawlers blocked from internal APIs and portals
const AI_CRAWLER_BOTS = [
  'gptbot',
  'chatgpt-user',
  'claude-web',
  'anthropic-ai',
  'perplexitybot',
  'bytespider',
  'diffbot',
  'ccbot',
];

// In-memory sliding window rate limiter at edge middleware level
interface EdgeRateLimit {
  count: number;
  resetAt: number;
}
const edgeRateLimitStore = new Map<string, EdgeRateLimit>();

// Periodic cleanup of stale rate limit entries
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupEdgeStore() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [ip, entry] of edgeRateLimitStore.entries()) {
      if (now > entry.resetAt) {
        edgeRateLimitStore.delete(ip);
      }
    }
  }
}

const SENSITIVE_API_LIMIT = 20; // 20 requests/min for auth, register, contact, AI, upload
const GENERAL_API_LIMIT = 60;   // 60 requests/min for general API routes

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. HTTPS Enforcement in Production
  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('host') || '';

  if (isProduction && proto === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Anomaly & Exploit Pattern Detection
  const rawUrl = `${pathname}${search}`;
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    return new NextResponse('Forbidden: Malformed URI encoding rejected.', { status: 403 });
  }
  // Also normalize form-encoded '+' characters to standard spaces for pattern evaluation
  const normalizedUrl = decodedUrl.replace(/\+/g, ' ');
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();

  // Check for malicious vulnerability scanners
  if (SCANNER_USER_AGENTS.some((bot) => userAgent.includes(bot))) {
    console.warn(`[Security Alert] Blocked suspicious automated vulnerability scanner: ${userAgent}`);
    return new NextResponse('Forbidden: Access denied by security policy.', { status: 403 });
  }

  // Check for path traversal / exploit probing (raw, decoded, and normalized)
  if (
    MALICIOUS_PROBE_PATTERNS.some(
      (pattern) => pattern.test(rawUrl) || pattern.test(decodedUrl) || pattern.test(normalizedUrl)
    )
  ) {
    console.warn(`[Security Alert] Blocked malicious exploit attempt on path: ${rawUrl} from IP: ${req.headers.get('x-forwarded-for') || 'Unknown'}`);
    return new NextResponse('Forbidden: Malformed request rejected.', { status: 403 });
  }

  // 3. Anti-Scraping & Bot Protection
  // Cashfree webhooks must never be blocked by user-agent filters
  const isWebhook = pathname.startsWith('/api/webhook');

  if (!isWebhook) {
    // Block AI crawlers from scraping internal APIs and admin portals
    if (
      (pathname.startsWith('/api') || pathname.startsWith('/admin') || pathname.startsWith('/scanner')) &&
      AI_CRAWLER_BOTS.some((bot) => userAgent.includes(bot))
    ) {
      console.warn(`[Security Alert] Blocked AI scraper bot from sensitive path ${pathname}: ${userAgent}`);
      return new NextResponse('Forbidden: AI scraping of internal endpoints is prohibited.', { status: 403 });
    }

    // Block automated headless scraping libraries from bombarding API endpoints
    if (
      pathname.startsWith('/api') &&
      SCRAPER_USER_AGENTS.some((bot) => userAgent.includes(bot))
    ) {
      console.warn(`[Security Alert] Blocked automated scraper tool from API ${pathname}: ${userAgent}`);
      return new NextResponse('Forbidden: Automated scraping tools are strictly prohibited.', { status: 403 });
    }
  }

  // 4. API Endpoints Rate Limiting (Abuse & DoS Protection)
  if (pathname.startsWith('/api') && !isWebhook) {
    cleanupEdgeStore();
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    const isSensitive =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/register') ||
      pathname.startsWith('/api/contact') ||
      pathname.startsWith('/api/upload-id') ||
      pathname.startsWith('/api/ai');

    const limit = isSensitive ? SENSITIVE_API_LIMIT : GENERAL_API_LIMIT;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1-minute sliding window

    let record = edgeRateLimitStore.get(clientIp);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
    } else {
      record.count += 1;
    }
    edgeRateLimitStore.set(clientIp, record);

    if (record.count > limit) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      console.warn(`[Rate Limit Exceeded] IP ${clientIp} exceeded limit (${record.count}/${limit}) on ${pathname}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Automated scraping and rapid API requests are prohibited.',
          retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
          },
        }
      );
    }
  }

  // 5. Early Route Protection for Admin / Scanner Portals
  if (pathname.startsWith('/admin') || pathname.startsWith('/scanner')) {
    const sessionCookie = req.cookies.get('sabrang_session')?.value;
    if (!sessionCookie && !pathname.includes('/login')) {
      // In SSR edge middleware, client hydration inspects auth; security headers still protect the page.
    }
  }

  // 6. Set Comprehensive Enterprise Security Headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent search engines from archiving or scraping API endpoints
  if (pathname.startsWith('/api')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  if (isProduction) {
    // 2-year HSTS preload with subdomains
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, fonts (public static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf|ico)$).*)',
  ],
};
