// app/api/link-meta.sj
import { redis } from '@/lib/redis';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CACHE_TTL = 60 * 10; // 10 minutes
const RATE_LIMIT_TTL = 60; // 1 minute
const RATE_LIMIT_REQUESTS = 10; // 10 requests per minute

const urlSchema = z.string().url({
  message: 'Invalid URL format',
});

export async function OPTIONS(_request) {
  return NextResponse.json(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.nextUrl);

  const url = searchParams.get('url');
  const refresh = searchParams.get('refresh') === 'true';

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }

  // Validate URL format
  const validationResult = urlSchema.safeParse(url);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }

  // Rate limiting
  const clientIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const rateLimitKey = `rate-limit:${clientIp}`;

  try {
    const currentRequests = await redis.incr(rateLimitKey);
    if (currentRequests === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_TTL);
    }

    if (currentRequests > RATE_LIMIT_REQUESTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Retry-After': RATE_LIMIT_TTL.toString(),
          },
        }
      );
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
  }

  const cacheKey = `link-meta:${url}`;

  if (!refresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(
          {
            ...JSON.parse(cached),
            cached: true,
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          }
        );
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
  }

  try {
    const result = await fetchMetaData(url);
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata', details: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

async function fetchMetaData(url) {
  const html = await fetchHtml(url);
  const dom = new JSDOM(html);
  const meta = dom.window.document.querySelectorAll('meta');
  const title = dom.window.document.querySelector('title');

  const getMeta = (property) =>
    Array.from(meta)
      .find((m) => m.getAttribute('property') === property)
      ?.getAttribute('content');

  const getMetaName = (name) =>
    Array.from(meta)
      .find((m) => m.getAttribute('name') === name)
      ?.getAttribute('content');

  const ogUrl = getMeta('og:url');

  if (ogUrl) {
    return await fetchOgUrlMeta(ogUrl);
  }

  // Extract favicon
  const favicon =
    dom.window.document
      .querySelector('link[rel="icon"]')
      ?.getAttribute('href') ||
    dom.window.document
      .querySelector('link[rel="shortcut icon"]')
      ?.getAttribute('href') ||
    `${new URL(url).origin}/favicon.ico`;

  // Extract domain
  const domain = new URL(url).hostname;

  return {
    title: getMeta('og:title') || title?.textContent || '',
    description: getMeta('og:description') || getMetaName('description') || '',
    image: getMeta('og:image') || '',
    url: url,
    domain: domain,
    favicon: favicon,
    siteName: getMeta('og:site_name') || domain,
    type: getMeta('og:type') || 'website',
  };
}

async function fetchOgUrlMeta(ogUrl) {
  const ogUrlHtml = await fetchHtml(ogUrl);

  const ogUrldom = new JSDOM(ogUrlHtml);
  const ogUrlMeta = ogUrldom.window.document.querySelectorAll('meta');
  const title = ogUrldom.window.document.querySelector('title');

  const getMetaFromUrl = (property) =>
    Array.from(ogUrlMeta)
      .find((m) => m.getAttribute('property') === property)
      ?.getAttribute('content');

  const getMetaNameFromUrl = (name) =>
    Array.from(ogUrlMeta)
      .find((m) => m.getAttribute('name') === name)
      ?.getAttribute('content');

  // Extract favicon
  const favicon =
    ogUrldom.window.document
      .querySelector('link[rel="icon"]')
      ?.getAttribute('href') ||
    ogUrldom.window.document
      .querySelector('link[rel="shortcut icon"]')
      ?.getAttribute('href') ||
    `${new URL(ogUrl).origin}/favicon.ico`;

  // Extract domain
  const domain = new URL(ogUrl).hostname;

  return {
    title: getMetaFromUrl('og:title') || title?.textContent || '',
    description:
      getMetaFromUrl('og:description') ||
      getMetaNameFromUrl('description') ||
      '',
    image: getMetaFromUrl('og:image') || '',
    url: ogUrl,
    domain: domain,
    favicon: favicon,
    siteName: getMetaFromUrl('og:site_name') || domain,
    type: getMetaFromUrl('og:type') || 'website',
  };
}

async function fetchHtml(url, retryCount = 0) {
  const USER_AGENTS = [
    'WhatsApp/2.21.12.21 A',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  ];

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENTS[retryCount % USER_AGENTS.length],
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
        DNT: '1',
        Connection: 'keep-alive',
      },
      timeout: 15000, // 15 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Check if we got meaningful content with og:image
    if (!html.includes('og:image') && retryCount < USER_AGENTS.length - 1) {
      console.log(
        `No og:image found with User-Agent ${USER_AGENTS[retryCount % USER_AGENTS.length]}, retrying...`
      );
      return fetchHtml(url, retryCount + 1);
    }

    return html;
  } catch (error) {
    if (retryCount < USER_AGENTS.length - 1) {
      console.log(
        `Fetch failed with User-Agent ${USER_AGENTS[retryCount % USER_AGENTS.length]}, retrying... Error: ${error.message}`
      );
      return fetchHtml(url, retryCount + 1);
    }
    console.error('Fetch HTML error:', error);
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
}
