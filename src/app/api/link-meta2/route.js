import { parse } from 'node-html-parser';
import { NextResponse } from 'next/server';

async function fetchMetadata(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const root = parse(html);

    return {
      title: root.querySelector('title')?.textContent || '',
      description:
        root.querySelector('meta[name="description"]')?.getAttribute('content') ||
        root.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        '',
      image: root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  const metadata = await fetchMetadata(url);

  if (!metadata) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }

  return NextResponse.json(metadata);
}
