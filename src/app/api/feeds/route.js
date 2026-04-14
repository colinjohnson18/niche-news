/**
 * API Route: /api/feeds
 *
 * Server-side RSS fetcher. Handles CORS, parses full article content,
 * and extracts pull quotes for the Cowboy Bebop-style rich summaries.
 */

import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "NicheNews/1.0 (RSS Reader)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content",   "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure",       "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

/** Extract the best thumbnail from an RSS item */
function extractImage(item) {
  if (item.mediaContent?.$?.url)   return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image"))
    return item.enclosure.url;
  const html = item.contentEncoded || item["content:encoded"] || item.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
}

/** Strip HTML tags and decode common entities */
function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g,  " ")
    .replace(/&amp;/g,   "&")
    .replace(/&lt;/g,    "<")
    .replace(/&gt;/g,    ">")
    .replace(/&quot;/g,  '"')
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/\s+/g,     " ")
    .trim();
}

/**
 * Extract pull quotes — real sentences from the article body.
 *
 * Strategy: take the full article text, split into sentences, and pick
 * 1-2 that are substantive (not too short, not boilerplate).
 */
function extractQuotes(item) {
  // Prefer full content over snippet
  const rawHtml =
    item.contentEncoded ||
    item["content:encoded"] ||
    item.content ||
    item["content:encodedSnippet"] ||
    item.summary ||
    "";

  const fullText = stripHtml(rawHtml);
  if (!fullText) return [];

  // Split into sentences on . ? ! followed by space + capital
  const sentences = fullText
    .split(/(?<=[.!?])\s+(?=[A-Z"'\u201C])/)
    .map((s) => s.trim())
    .filter((s) => {
      const len = s.length;
      // Must be a real sentence (60-350 chars)
      if (len < 60 || len > 350) return false;
      // Skip boilerplate patterns
      const boilerplate = [
        /^(click|read more|subscribe|sign up|follow us|share this|tweet|advertisement)/i,
        /^(this article|this story|this post|this piece|the article)/i,
        /^(you (can|may|might|should|have))/i,
        /copyright|all rights reserved|terms of service/i,
      ];
      return !boilerplate.some((pattern) => pattern.test(s));
    });

  // Pick the 2 most "quote-worthy" sentences:
  // Prefer sentences from the middle of the article (not the intro fluff)
  const startIdx = Math.floor(sentences.length * 0.1);
  const endIdx   = Math.floor(sentences.length * 0.75);
  const pool     = sentences.slice(startIdx, endIdx);

  // Score: reward sentences that have proper nouns, numbers, or quotes
  const scored = pool.map((s) => {
    let score = 0;
    if (/\d/.test(s))                        score += 2; // numbers = specific
    if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(s))  score += 1; // proper names
    if (/["'\u201C\u201D]/.test(s))          score += 1; // contains a quote
    if (s.length > 120 && s.length < 280)    score += 1; // good length
    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 1).map(({ s }) => s); // Return top 1 pull quote
}

/** Build a short, clean summary (distinct from the pull quote) */
function buildSummary(item) {
  const snippet =
    item.contentSnippet ||
    stripHtml(item.summary || item.content || "");
  return snippet.slice(0, 200).trim() + (snippet.length > 200 ? "…" : "");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const urls       = searchParams.get("urls")?.split(",").filter(Boolean) || [];
  const categoryId = searchParams.get("categoryId") || "unknown";

  if (urls.length === 0) {
    return Response.json({ error: "No feed URLs provided" }, { status: 400 });
  }

  try {
    const results = await Promise.allSettled(
      urls.map((url) => parser.parseURL(url.trim()))
    );

    const articles = [];

    results.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        console.warn(`Feed ${urls[index]} failed:`, result.reason?.message);
        return;
      }
      const feed = result.value;
      feed.items?.forEach((item) => {
        // Google News titles include "Headline - Publisher Name" — extract real publisher
        let title  = item.title || "Untitled";
        let source = feed.title || new URL(urls[index]).hostname;

        const isGoogleNews = urls[index]?.includes("news.google.com");
        if (isGoogleNews) {
          const dashIdx = title.lastIndexOf(" - ");
          if (dashIdx > 0) {
            source = title.slice(dashIdx + 3).trim();
            title  = title.slice(0, dashIdx).trim();
          }
        }

        articles.push({
          id:      `${categoryId}-${index}-${item.guid || item.link || item.title}`,
          categoryId,
          title,
          link:    item.link  || "",
          source,
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          image:   extractImage(item),
          summary: buildSummary(item),
          quotes:  extractQuotes(item), // ← pull quotes from article body
        });
      });
    });

    // Newest first
    articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Cap at max 3 articles per source to ensure diversity
    const sourceCounts = {};
    const diverseArticles = articles.filter((a) => {
      const key = a.source.toLowerCase().trim();
      sourceCounts[key] = (sourceCounts[key] || 0) + 1;
      return sourceCounts[key] <= 3;
    });

    return Response.json({
      articles:  diverseArticles.slice(0, 25),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Feed error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
