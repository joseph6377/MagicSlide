import { NextRequest, NextResponse } from 'next/server';
import { extractSlidesFromHTML, generateQueriesForSlide, matchImagesToSlides } from '@/lib/slide-image-matcher';
import { ImageSearchQuery, ImageSearchResult } from '@/lib/slide-image-matcher';

interface MatchImagesRequest {
  html: string;
  maxQueriesPerSlide?: number;
  maxImagesPerSlide?: number;
}

/**
 * POST handler for matching images to slides
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { html, maxQueriesPerSlide = 3, maxImagesPerSlide = 5 }: MatchImagesRequest = await request.json();
    
    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }
    
    // Extract slides from HTML
    const slides = extractSlidesFromHTML(html);
    
    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides found in the HTML content' },
        { status: 400 }
      );
    }
    
    // Generate queries for each slide
    const slideQueries = slides.map(slide => {
      const queries = generateQueriesForSlide(slide);
      return {
        slide,
        queries: queries.slice(0, maxQueriesPerSlide)
      };
    });
    
    // Flatten queries for batch search
    const allQueries = slideQueries.flatMap(sq => sq.queries);
    
    // Remove duplicate queries
    const uniqueQueries = allQueries.filter((query, index, self) => 
      index === self.findIndex(q => q.q === query.q)
    );
    
    // Prepare queries for batch search
    const batchQueries = uniqueQueries.map(query => ({
      q: query.q,
      imageType: query.imageType,
      orientation: query.orientation,
      minWidth: query.minWidth,
      minHeight: query.minHeight,
      editorsChoice: query.editorsChoice,
      perPage: 5
    }));
    
    // Search for images
    const searchResponse = await fetch(`${request.nextUrl.origin}/api/pixabay/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({ queries: batchQueries })
    });
    
    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      return NextResponse.json(
        { error: 'Failed to search for images', details: error },
        { status: searchResponse.status }
      );
    }
    
    // Parse search results
    const searchResults = await searchResponse.json() as ImageSearchResult[];
    
    // Match images to slides
    const slidesWithImages = matchImagesToSlides(slides, searchResults);
    
    // Limit the number of images per slide
    const limitedSlidesWithImages = slidesWithImages.map(slide => ({
      ...slide,
      suggestedImages: slide.suggestedImages.slice(0, maxImagesPerSlide)
    }));
    
    // Return the slides with matched images
    return NextResponse.json({
      slides: limitedSlidesWithImages,
      totalSlides: slides.length,
      totalQueries: uniqueQueries.length,
      totalImages: searchResults.reduce((sum, result) => sum + result.result.hits.length, 0)
    });
  } catch (error) {
    console.error('Image matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match images to slides' },
      { status: 500 }
    );
  }
} 