# Scout Service Configuration

## Environment Variables

Add these to your `.env.local` file:

```bash
# Scout Service Configuration
SCOUT_ALLOWED_HOSTS=partiful.com,doodle.com,when2meet.com,eventbrite.com,meetup.com,facebook.com,luma.com

# MongoDB Configuration (if not already set)
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=marketlens
```

## Allowed Domains

The Scout service only allows scraping from whitelisted domains for security. Default allowed domains:

- partiful.com
- doodle.com  
- when2meet.com
- eventbrite.com
- meetup.com
- facebook.com
- luma.com

To add more domains, update the `SCOUT_ALLOWED_HOSTS` environment variable with a comma-separated list.

## API Endpoints

### POST /api/scout/crawl
Scrapes competitor pages and stores content.

**Request:**
```json
{
  "urls": [
    "https://partiful.com",
    "https://doodle.com"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "url": "https://partiful.com",
      "title": "Partiful - Event Planning Made Easy",
      "status": "scraped",
      "preview": "Create beautiful event pages..."
    }
  ],
  "total": 1
}
```

### GET /api/scout/page?id=<page_id>
Retrieves cleaned text and metadata for a scraped page.

**Response:**
```json
{
  "id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "url": "https://partiful.com",
  "title": "Partiful - Event Planning Made Easy",
  "text": "Clean extracted text content...",
  "domain": "partiful.com",
  "metaDescription": "Create beautiful event pages",
  "fetchedAt": "2024-01-15T10:30:00Z",
  "hasScreenshot": true
}
```

## Features

- **Headless Browser Scraping**: Uses Playwright Chromium for JavaScript-heavy sites
- **Content Extraction**: Uses Mozilla Readability for clean article text
- **Screenshot Capture**: Takes viewport screenshots for visual reference
- **Caching**: Avoids re-scraping same URLs within 24 hours
- **Rate Limiting**: 1-second delay between requests
- **Security**: Domain whitelist and 10-second timeout per page
- **Error Handling**: Graceful failure with error storage

## Usage in UI

1. Navigate to the Map tab in Phase-1
2. Click "🕵️ Scout Market" button
3. Enter competitor URLs (one per line)
4. Click "Scout Market" to start scraping
5. View results with titles, status, and content previews
