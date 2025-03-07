import { NextRequest, NextResponse } from 'next/server';
import { WikimediaSearchParams, searchWikimediaImages } from '@/lib/wikimedia';

export const maxDuration = 30; // Maximum execution time in seconds
export const dynamic = 'force-dynamic'; // Mark route as dynamic for Vercel deployment

/**
 * GET handler for Wikimedia Commons image search
 */
export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const imageType = searchParams.get('imageType') || 'all';
    const orientation = searchParams.get('orientation') || 'all';

    // Validate required parameters
    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required parameter: keyword' },
        { status: 400 }
      );
    }

    console.log(`[WIKIMEDIA API] Searching for "${keyword}" with limit ${limit}, type: ${imageType}, orientation: ${orientation}`);

    // Create search parameters object
    const wikimediaParams: WikimediaSearchParams = {
      keyword,
      limit,
      imageType,
      orientation,
    };

    // Search for images
    const results = await searchWikimediaImages(wikimediaParams);

    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    console.log(`[WIKIMEDIA API] Found ${results.images?.length || 0} images for "${keyword}"`);

    // Return the results
    return NextResponse.json(results, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Error in Wikimedia API route:', error);
    
    return NextResponse.json(
      { error: 'Failed to search Wikimedia images' },
      { status: 500 }
    );
  }
} 