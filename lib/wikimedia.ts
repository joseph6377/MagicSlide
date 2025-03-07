/**
 * Wikimedia Commons API utility functions
 * This file provides functions to search and retrieve images from Wikimedia Commons
 */

// Wikimedia Commons API endpoint
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';

/**
 * Interface for Wikimedia Commons image search parameters
 */
export interface WikimediaSearchParams {
  keyword: string;          // Search term
  limit?: number;           // Number of results to return (default: 10)
  imageType?: string;       // Type of image (photo, illustration, etc.)
  orientation?: string;     // Orientation of image (horizontal, vertical, etc.)
}

/**
 * Interface for Wikimedia Commons image
 */
export interface WikimediaImage {
  url: string;
  thumbUrl?: string;
  title: string;
  description?: string;
  descriptionUrl?: string;
  width?: number;
  height?: number;
  license?: string;
  author?: string;
  relevanceScore?: number;
  mimeType?: string;
}

/**
 * Interface for Wikimedia Commons search response
 */
export interface WikimediaSearchResponse {
  images?: WikimediaImage[];
  total?: number;
  error?: string;
}

/**
 * Check if an image is relevant to the search query
 * @param title Image title
 * @param query Search query
 * @returns Relevance score (0-100)
 */
function calculateRelevanceScore(title: string, query: string): number {
  // Normalize strings for comparison
  const normalizedTitle = title.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Split query into keywords
  const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 2);
  
  // Calculate how many keywords are in the title
  let matchedKeywords = 0;
  for (const keyword of keywords) {
    if (normalizedTitle.includes(keyword)) {
      matchedKeywords++;
    }
  }
  
  // Calculate score based on percentage of matched keywords
  const score = keywords.length > 0 ? (matchedKeywords / keywords.length) * 100 : 0;
  
  return score;
}

/**
 * Check if an image is of the requested type
 * @param mimeType MIME type of the image
 * @param imageType Requested image type
 * @returns True if the image matches the requested type
 */
function matchesImageType(mimeType: string, imageType?: string): boolean {
  if (!imageType || imageType === 'all') {
    return true;
  }
  
  // Simple mapping of requested types to MIME types
  switch (imageType.toLowerCase()) {
    case 'photo':
      return mimeType === 'image/jpeg' || mimeType === 'image/png';
    case 'illustration':
      return mimeType === 'image/svg+xml' || mimeType === 'image/png';
    case 'vector':
      return mimeType === 'image/svg+xml';
    default:
      return true;
  }
}

/**
 * Search for images on Wikimedia Commons
 * @param params Search parameters
 * @returns Promise with search response
 */
export async function searchWikimediaImages(
  params: WikimediaSearchParams
): Promise<WikimediaSearchResponse> {
  console.log(`[WIKIMEDIA] Searching for "${params.keyword}" with limit ${params.limit || 10}`);

  let images: WikimediaImage[] = [];
  
  // First attempt: search with File: prefix in file namespace
  images = await searchWithMethod(params, 'file_namespace');
  
  // If no results, try second method: direct keyword search in file namespace
  if (images.length === 0) {
    console.log(`[WIKIMEDIA] No images found with first method, trying direct keyword search`);
    images = await searchWithMethod(params, 'direct_keyword');
  }
  
  // If still no results, try third method: category search
  if (images.length === 0) {
    console.log(`[WIKIMEDIA] No images found with second method, trying category search`);
    images = await searchWithMethod(params, 'category');
  }
  
  // If still no results, try a simplified search with just the main subject
  if (images.length === 0) {
    console.log(`[WIKIMEDIA] No images found with specific queries, trying simplified search`);
    
    // Extract the main subject from the keyword (usually the first 1-2 words)
    const mainSubject = extractMainSubject(params.keyword);
    
    if (mainSubject && mainSubject !== params.keyword) {
      console.log(`[WIKIMEDIA] Searching for main subject: "${mainSubject}"`);
      
      // Create a simplified params object
      const simplifiedParams: WikimediaSearchParams = {
        ...params,
        keyword: mainSubject
      };
      
      // Try direct keyword search with the simplified query
      const simplifiedImages = await searchWithMethod(simplifiedParams, 'direct_keyword');
      
      if (simplifiedImages.length > 0) {
        console.log(`[WIKIMEDIA] Found ${simplifiedImages.length} images with simplified search`);
        images = simplifiedImages;
      }
    }
  }
  
  // Filter images by relevance score
  const RELEVANCE_THRESHOLD = 20; // Lower threshold to allow more images
  const relevantImages = images.filter(img => (img.relevanceScore || 0) >= RELEVANCE_THRESHOLD);
  
  // If we have relevant images, use those; otherwise fall back to all images
  const finalImages = relevantImages.length > 0 ? relevantImages : images;
  
  // Sort by relevance score (highest first)
  finalImages.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  
  // Limit to requested number
  const limitedImages = finalImages.slice(0, params.limit || 10);
  
  console.log(`[WIKIMEDIA] Returning ${limitedImages.length} images in total (from ${images.length} found, ${relevantImages.length} relevant)`);
  
  return {
    total: limitedImages.length,
    images: limitedImages
  };
}

/**
 * Extract the main subject from a search query
 * @param query Search query
 * @returns Main subject
 */
function extractMainSubject(query: string): string {
  // Remove any specific actions or descriptors
  const simplifiedQuery = query
    .replace(/celebrating|portrait|silhouette|against|playing|hitting|raising|receiving|waving|giving/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into words
  const words = simplifiedQuery.split(' ');
  
  // If we have multiple words, take the first 2-3 words as the main subject
  if (words.length > 1) {
    return words.slice(0, Math.min(3, words.length)).join(' ');
  }
  
  return simplifiedQuery;
}

/**
 * Helper function to search using different methods
 * @param params Search parameters
 * @param method Search method to use
 * @returns Array of WikimediaImage objects
 */
async function searchWithMethod(
  params: WikimediaSearchParams,
  method: 'file_namespace' | 'direct_keyword' | 'category'
): Promise<WikimediaImage[]> {
  // Build query parameters based on method
  const queryParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'url|mime|timestamp|thumburl',
    iiurlwidth: '200', // Request thumbnails at 200px width
    iiurlheight: '150' // Request thumbnails at 150px height
  });
  
  // Add method-specific parameters
  if (method === 'file_namespace') {
    // Search for files with File: prefix
    queryParams.append('generator', 'search');
    queryParams.append('gsrsearch', `File:${params.keyword}`);
    queryParams.append('gsrnamespace', '6');
    queryParams.append('gsrlimit', params.limit?.toString() || '10');
  } 
  else if (method === 'direct_keyword') {
    // Direct keyword search in file namespace
    queryParams.append('generator', 'search');
    queryParams.append('gsrsearch', params.keyword);
    queryParams.append('gsrnamespace', '6');
    queryParams.append('gsrlimit', params.limit?.toString() || '10');
  }
  else if (method === 'category') {
    // Search in categories
    queryParams.append('generator', 'categorymembers');
    queryParams.append('gcmtitle', `Category:${params.keyword}`);
    queryParams.append('gcmtype', 'file');
    queryParams.append('gcmlimit', params.limit?.toString() || '10');
  }

  console.log(`[WIKIMEDIA] ${method} search URL: ${WIKIMEDIA_API_URL}?${queryParams.toString()}`);

  // Make API request
  const response = await fetch(`${WIKIMEDIA_API_URL}?${queryParams.toString()}`);
  
  if (!response.ok) {
    console.log(`[WIKIMEDIA] API error with ${method}: ${response.status} ${response.statusText}`);
    return [];
  }
  
  const data = await response.json();
  const images: WikimediaImage[] = [];
  
  // Convert response to our format
  if (data.query && data.query.pages) {
    console.log(`[WIKIMEDIA] Found ${Object.keys(data.query.pages).length} pages with ${method}`);
    
    for (const [pageId, page] of Object.entries(data.query.pages)) {
      const pageData = page as any;
      
      if (pageData.imageinfo && pageData.imageinfo.length > 0) {
        // Only include actual image files (filtering out PDFs, etc.)
        const mimeType = pageData.imageinfo[0].mime;
        
        if (mimeType && mimeType.startsWith('image/')) {
          // Calculate relevance score
          const relevanceScore = calculateRelevanceScore(pageData.title, params.keyword);
          
          // Check if image type matches requested type
          const matchesType = matchesImageType(mimeType, params.imageType);
          
          if (matchesType) {
            // Get the thumbnail URL if available, or create one if not
            const thumbUrl = pageData.imageinfo[0].thumburl || 
                             (pageData.imageinfo[0].url.includes('?') 
                               ? `${pageData.imageinfo[0].url}&width=200` 
                               : `${pageData.imageinfo[0].url}?width=200`);
            
            images.push({
              url: pageData.imageinfo[0].url,
              title: pageData.title,
              descriptionUrl: pageData.imageinfo[0].descriptionurl,
              thumbUrl: thumbUrl,
              relevanceScore: relevanceScore,
              mimeType: mimeType
            });
            console.log(`[WIKIMEDIA] Added image with ${method}: ${pageData.title} (relevance: ${relevanceScore.toFixed(1)})`);
          } else {
            console.log(`[WIKIMEDIA] Skipped image with wrong type: ${pageData.title} (${mimeType})`);
          }
        } else {
          console.log(`[WIKIMEDIA] Skipped non-image file with ${method}: ${pageData.title} (${mimeType})`);
        }
      }
    }
  }
  
  console.log(`[WIKIMEDIA] Found ${images.length} images using ${method}`);
  return images;
} 