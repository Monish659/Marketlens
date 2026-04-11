import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { getUserDb } from '@/lib/db';
import { ScoutPageDoc } from '@/lib/schema';
import { chunkTextByLength, embedTextCohereV4 } from '@/lib/embed';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth';

const ALLOWED_HOSTS = process.env.SCOUT_ALLOWED_HOSTS?.split(',').map(h => h.trim()) || [
  'partiful.com',
  'doodle.com',
  'when2meet.com',
  'eventbrite.com',
  'meetup.com',
  'facebook.com',
  'luma.com'
];

const TIMEOUT_MS = 30000;
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

function isAllowedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    return ALLOWED_HOSTS.some(allowedHost => 
      domain === allowedHost || domain.endsWith('.' + allowedHost)
    );
  } catch {
    return false;
  }
}

async function scrapePage(url: string): Promise<Partial<ScoutPageDoc>> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Block heavy resources to speed up and reduce timeouts
  await page.route('**/*', (route) => {
    const req = route.request();
    const type = req.resourceType();
    if (['image', 'media', 'font'].includes(type)) return route.abort();
    return route.continue();
  });
  
  try {
    // Set viewport and user agent
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Navigate with timeout (faster and more reliable on dynamic sites)
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_MS,
    });
    // Best-effort settle
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Get HTML content
    const html = await page.content();
    
    // Take screenshot (optional)
    let screenshotBase64: string | undefined;
    try {
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBase64 = screenshot.toString('base64');
    } catch {}

    await browser.close();

    // Parse with Cheerio for metadata
    const $ = cheerio.load(html);
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';

    // Clean HTML (remove scripts, styles, etc.)
    $('script, style, noscript, iframe').remove();
    const cleanedHtml = $.html();

    // Extract main content using Readability
    const dom = new JSDOM(cleanedHtml, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    const text = article?.textContent || $('body').text().replace(/\s+/g, ' ').trim();
    const domain = new URL(url).hostname;

    return {
      url,
      title,
      html: cleanedHtml,
      text,
      screenshot: screenshotBase64,
      fetchedAt: new Date(),
      domain,
      metaDescription
    };

  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'urls array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 URLs allowed per request' },
        { status: 400 }
      );
    }

    // Validate URLs
    const validUrls = urls.filter(url => {
      if (typeof url !== 'string') return false;
      if (!isAllowedUrl(url)) return false;
      return true;
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs provided. Allowed domains: ' + ALLOWED_HOSTS.join(', ') },
        { status: 400 }
      );
    }

    const db = await getUserDb(user.auth0Id);
    const collection = db.collection<ScoutPageDoc>('scout_pages');

    const results = [];
    
    for (const url of validUrls) {
      try {
        // Check if URL already exists and is recent (within 24 hours)
        const existing = await collection.findOne({ 
          url,
          fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (existing) {
          results.push({
            id: existing._id?.toString(),
            url,
            title: existing.title,
            status: 'cached',
            preview: existing.text.substring(0, 400) + '...'
          });
          continue;
        }

        // Rate limiting
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }

        // Scrape the page
        const pageData = await scrapePage(url);
        
        // Save to database
        const result = await collection.insertOne({
          ...pageData,
          fetchedAt: new Date()
        } as ScoutPageDoc);

        // Create vector chunks and store embeddings
        try {
          const vectors = db.collection('scout_vectors');
          const chunks = chunkTextByLength(pageData.text || '');
          for (const chunk of chunks) {
            // Embed each chunk (document input)
            const embedding = await embedTextCohereV4(chunk.text, 'search_document');
            await vectors.updateOne(
              { pageId: result.insertedId, chunkId: chunk.id },
              {
                $set: {
                  pageId: result.insertedId,
                  chunkId: chunk.id,
                  text: chunk.text,
                  embedding,
                  url,
                },
              },
              { upsert: true }
            );
          }
        } catch (e) {
          console.error('Embedding error for URL', url, e);
        }

        results.push({
          id: result.insertedId.toString(),
          url,
          title: pageData.title,
          status: 'scraped',
          preview: pageData.text?.substring(0, 400) + '...' || 'No content extracted'
        });

      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        
        // Save error to database
        await collection.insertOne({
          url,
          title: 'Error',
          html: '',
          text: '',
          fetchedAt: new Date(),
          domain: new URL(url).hostname,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as ScoutPageDoc);

        results.push({
          id: null,
          url,
          title: 'Error',
          status: 'error',
          preview: error instanceof Error ? error.message : 'Failed to scrape'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: results.length
    });

  } catch (error) {
    console.error('Scout crawl error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
