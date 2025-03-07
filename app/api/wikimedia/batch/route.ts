import { NextRequest, NextResponse } from 'next/server';
import { searchWikimediaImages, WikimediaSearchParams } from '@/lib/wikimedia';

// Rate limiting - simple in-memory implementation
const RATE_LIMIT = 100; // 100 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestLog: { [ip: string]: number[] } = {};

interface BatchSearchRequest {
  queries: {
    q: string;
    limit?: number;
    imageType?: string;
    orientation?: string;
  }[];
}

/**
 * Check if the client is rate limited
 * @param ip Client IP address
 * @returns True if rate limited, false otherwise
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  
  // Initialize request log for this IP if not exists
  if (!requestLog[ip]) {
    requestLog[ip] = [];
  }
  
  // Remove old requests outside the rate window
  requestLog[ip] = requestLog[ip].filter(timestamp => now - timestamp < RATE_WINDOW);
  
  // Check if rate limit is exceeded
  if (requestLog[ip].length >= RATE_LIMIT) {
    return true;
  }
  
  // Add current request to log
  requestLog[ip].push(now);
  
  return false;
}

// Mark route as dynamic for Vercel deployment
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Maximum execution time in seconds

/**
 * POST handler for Wikimedia Commons batch image search
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body: BatchSearchRequest = await request.json();
    
    // Validate request
    if (!body || !body.queries || !Array.isArray(body.queries) || body.queries.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: queries array is required' },
        { status: 400 }
      );
    }
    
    // Limit the number of queries to prevent abuse
    const queries = body.queries.slice(0, 10);
    
    // Process each query
    const searchPromises = queries.map(query => {
      // Convert query parameters to Wikimedia API format
      const params: WikimediaSearchParams = {
        keyword: query.q,
        limit: query.limit || 5,
        imageType: query.imageType,
        orientation: query.orientation
      };
      
      // Search for images
      return searchWikimediaImages(params)
        .then(result => ({
          query: query.q,
          result
        }))
        .catch(error => ({
          query: query.q,
          error: error.message
        }));
    });
    
    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);
    
    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Return results
    return NextResponse.json(results, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Wikimedia Commons batch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Wikimedia Commons' },
      { status: 500 }
    );
  }
} 