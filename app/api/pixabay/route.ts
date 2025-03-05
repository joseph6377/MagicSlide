import { NextRequest, NextResponse } from 'next/server';
import { searchPixabayImages, PixabaySearchParams } from '@/lib/pixabay';
import { cookies } from 'next/headers';

// Default Pixabay API key - using the one from the example
const DEFAULT_PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '49170333-b9269c8d15b388c14bcbbe621';

// Rate limiting - simple in-memory implementation
const RATE_LIMIT = 100; // 100 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const requestLog: { [ip: string]: number[] } = {};

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
 * @returns Whether the request is rate limited
 */
function isRateLimited(ip: string): boolean {
  cleanupRequestLog();
  
  if (!requestLog[ip]) {
    requestLog[ip] = [];
  }
  
  if (requestLog[ip].length >= RATE_LIMIT) {
    return true;
  }
  
  requestLog[ip].push(Date.now());
  return false;
}

/**
 * GET handler for Pixabay image search
 */
export async function GET(request: NextRequest) {
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
    
    // Get search parameters from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    // Query is required
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Get the Pixabay API key from cookies or use default
    const cookieStore = cookies();
    const storedApiKey = cookieStore.get('slidemagic-pixabay-api-key')?.value;
    const apiKey = storedApiKey || DEFAULT_PIXABAY_API_KEY;
    
    // Build search parameters
    const params: PixabaySearchParams = {
      q: query,
      safesearch: true,
    };
    
    // Add optional parameters if provided
    if (searchParams.has('image_type')) {
      params.image_type = searchParams.get('image_type') as any;
    }
    
    if (searchParams.has('orientation')) {
      params.orientation = searchParams.get('orientation') as any;
    }
    
    if (searchParams.has('category')) {
      params.category = searchParams.get('category') as string;
    }
    
    if (searchParams.has('min_width')) {
      params.min_width = parseInt(searchParams.get('min_width') || '0', 10);
    }
    
    if (searchParams.has('min_height')) {
      params.min_height = parseInt(searchParams.get('min_height') || '0', 10);
    }
    
    if (searchParams.has('colors')) {
      params.colors = searchParams.get('colors') as string;
    }
    
    if (searchParams.has('editors_choice')) {
      params.editors_choice = searchParams.get('editors_choice') === '1';
    }
    
    if (searchParams.has('order')) {
      params.order = searchParams.get('order') as any;
    }
    
    if (searchParams.has('page')) {
      params.page = parseInt(searchParams.get('page') || '1', 10);
    }
    
    if (searchParams.has('per_page')) {
      params.per_page = parseInt(searchParams.get('per_page') || '20', 10);
    }
    
    // Search for images
    const results = await searchPixabayImages(params, apiKey);
    
    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Return results
    return NextResponse.json(results, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Pixabay API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Pixabay' },
      { status: 500 }
    );
  }
} 