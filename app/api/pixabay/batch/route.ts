import { NextRequest, NextResponse } from 'next/server';
import { searchPixabayImages, PixabaySearchParams } from '@/lib/pixabay';
import { cookies } from 'next/headers';

// Default Pixabay API key
const DEFAULT_PIXABAY_API_KEY = '49170333-b9269c8d15b388c14bcbbe621';

// Rate limiting - simple in-memory implementation
const RATE_LIMIT = 100; // 100 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestLog: { [ip: string]: number[] } = {};

interface BatchSearchRequest {
  queries: {
    q: string;
    imageType?: 'all' | 'photo' | 'illustration' | 'vector';
    orientation?: 'all' | 'horizontal' | 'vertical';
    category?: string;
    minWidth?: number;
    minHeight?: number;
    colors?: string;
    editorsChoice?: boolean;
    order?: 'popular' | 'latest';
    perPage?: number;
  }[];
}

/**
 * Clean up old requests from the rate limit log
 */
function cleanupRequestLog() {
  const now = Date.now();
  Object.keys(requestLog).forEach(ip => {
    requestLog[ip] = requestLog[ip].filter(timestamp => now - timestamp < RATE_WINDOW);
    if (requestLog[ip].length === 0) {
      delete requestLog[ip];
    }
  });
}

/**
 * Check if a request is rate limited
 * @param ip IP address
 * @param count Number of queries in the batch
 * @returns Whether the request is rate limited
 */
function isRateLimited(ip: string, count: number): boolean {
  cleanupRequestLog();
  
  if (!requestLog[ip]) {
    requestLog[ip] = [];
  }
  
  // Check if adding these queries would exceed the rate limit
  if (requestLog[ip].length + count > RATE_LIMIT) {
    return true;
  }
  
  // Add timestamps for each query
  for (let i = 0; i < count; i++) {
    requestLog[ip].push(Date.now());
  }
  
  return false;
}

/**
 * POST handler for batch Pixabay image search
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Parse request body
    const { queries }: BatchSearchRequest = await request.json();
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'Queries array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Limit batch size to prevent abuse
    if (queries.length > 10) {
      return NextResponse.json(
        { error: 'Batch size is limited to 10 queries' },
        { status: 400 }
      );
    }
    
    // Check rate limit
    if (isRateLimited(ip, queries.length)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Get the Pixabay API key from cookies or use default
    const cookieStore = cookies();
    const storedApiKey = cookieStore.get('slidemagic-pixabay-api-key')?.value;
    const apiKey = storedApiKey || DEFAULT_PIXABAY_API_KEY;
    
    // Process each query
    const searchPromises = queries.map(query => {
      // Convert query parameters to Pixabay API format
      const params: PixabaySearchParams = {
        q: query.q,
        safesearch: true,
        image_type: query.imageType as any,
        orientation: query.orientation as any,
        category: query.category,
        min_width: query.minWidth,
        min_height: query.minHeight,
        colors: query.colors,
        editors_choice: query.editorsChoice,
        order: query.order as any,
        per_page: query.perPage || 5,
        page: 1
      };
      
      // Search for images
      return searchPixabayImages(params, apiKey)
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
    console.error('Pixabay batch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Pixabay' },
      { status: 500 }
    );
  }
} 