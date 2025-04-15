// app/api/link-meta.sj
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.nextUrl);

  const url = searchParams.get("url");

  try {
    const result = await fetchMetaData(url);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}

async function fetchMetaData(url) {
  const html = await fetchHtml(url);
  const dom = new JSDOM(html);
  const meta = dom.window.document.querySelectorAll("meta");

  const getMeta = (property) =>
    Array.from(meta)
      .find((m) => m.getAttribute("property") === property)
      ?.getAttribute("content");

  const ogUrl = getMeta("og:url");

  if (ogUrl) {
    return await fetchOgUrlMeta(ogUrl);
  }

  return {
    title: getMeta("og:title") || "",
    image: getMeta("og:image") || "",
    description: getMeta("og:description") || "",
  };
}

async function fetchOgUrlMeta(ogUrl) {
  const ogUrlHtml = await fetchHtml(ogUrl);

  const ogUrldom = new JSDOM(ogUrlHtml);
  const ogUrlMeta = ogUrldom.window.document.querySelectorAll("meta");

  const getMetaFromUrl = (property) =>
    Array.from(ogUrlMeta)
      .find((m) => m.getAttribute("property") === property)
      ?.getAttribute("content");

  return {
    title: getMetaFromUrl("og:title") || "",
    image: getMetaFromUrl("og:image") || "",
    description: getMetaFromUrl("og:description") || "",
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/122.0.0.0 Safari/537.36",
    },
  });
  return response.text();
}
