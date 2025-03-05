import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

// Function to generate a cache key for an image URL
const generateCacheKey = (url: string) => {
  return crypto.createHash('md5').update(url).digest('hex');
};

// Function to ensure cache directory exists
const ensureCacheDir = async () => {
  const cacheDir = path.join(process.cwd(), 'pixabay-cache');
  try {
    await mkdir(cacheDir, { recursive: true });
    console.log('Cache directory created or verified:', cacheDir);
  } catch (error) {
    console.error('Error creating cache directory:', error);
    // Directory may already exist
  }
  return cacheDir;
};

/**
 * GET handler for Pixabay images
 * This endpoint now redirects to the original Pixabay image URL
 * to avoid 403 forbidden errors from Pixabay
 */
export async function GET(request: NextRequest) {
  try {
    // Get the image URL from the query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    // URL is required
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Validate that the URL is from Pixabay
    if (!imageUrl.startsWith('https://pixabay.com/') && 
        !imageUrl.startsWith('https://cdn.pixabay.com/') && 
        !imageUrl.includes('pixabay.com')) {
      return NextResponse.json(
        { error: 'Only Pixabay image URLs are allowed' },
        { status: 400 }
      );
    }

    console.log(`Processing Pixabay image: ${imageUrl}`);
    
    // Always redirect to the original image URL
    // This avoids the 403 error because the request will come from the client's browser
    return NextResponse.redirect(imageUrl);
  } catch (error) {
    console.error('Image handler error:', error);
    
    // Generate a fallback SVG in case of errors
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">
          Image Handler Error
        </text>
        <text x="50%" y="58%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">
          ${error instanceof Error ? error.message : 'Unknown error'}
        </text>
        <text x="50%" y="66%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">
          Images provided by Pixabay
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
} 