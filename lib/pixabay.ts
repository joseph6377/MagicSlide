/**
 * Pixabay API utility functions
 * This file provides functions to search and retrieve images from Pixabay
 */

// Pixabay API endpoint
const PIXABAY_API_URL = 'https://pixabay.com/api/';

// Default API key - replace with your own or use from environment
const DEFAULT_API_KEY = process.env.PIXABAY_API_KEY || '49170333-b9269c8d15b388c14bcbbe621';

/**
 * Interface for Pixabay image search parameters
 */
export interface PixabaySearchParams {
  q: string;                // Search term
  lang?: string;            // Language code (default: 'en')
  image_type?: 'all' | 'photo' | 'illustration' | 'vector'; // Image type
  orientation?: 'all' | 'horizontal' | 'vertical'; // Image orientation
  category?: string;        // Category
  min_width?: number;       // Minimum image width
  min_height?: number;      // Minimum image height
  colors?: string;          // Colors
  editors_choice?: boolean; // Editor's choice
  safesearch?: boolean;     // Safe search
  order?: 'popular' | 'latest'; // Order
  page?: number;            // Page number
  per_page?: number;        // Results per page (default: 20, max: 200)
}

/**
 * Interface for Pixabay image hit
 */
export interface PixabayImageHit {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  collections: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

/**
 * Interface for Pixabay search response
 */
export interface PixabaySearchResponse {
  total: number;
  totalHits: number;
  hits: PixabayImageHit[];
}

/**
 * Search for images on Pixabay
 * @param params Search parameters
 * @param apiKey Pixabay API key
 * @returns Promise with search results
 */
export async function searchPixabayImages(
  params: PixabaySearchParams,
  apiKey: string = DEFAULT_API_KEY
): Promise<PixabaySearchResponse> {
  // Build query parameters
  const queryParams = new URLSearchParams({
    key: apiKey,
    ...params,
    editors_choice: params.editors_choice ? '1' : '0',
    safesearch: params.safesearch ? '1' : '0',
  } as any);

  // Make API request
  const response = await fetch(`${PIXABAY_API_URL}?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get an appropriate image size based on desired dimensions
 * @param hit Pixabay image hit
 * @param width Desired width
 * @param height Desired height
 * @returns URL of the appropriate image size
 */
export function getAppropriateImageSize(
  hit: PixabayImageHit,
  width: number,
  height: number
): string {
  // For small thumbnails (< 150px)
  if (width <= 150 && height <= 150) {
    return hit.previewURL;
  }
  
  // For medium sizes (< 640px)
  if (width <= 640 && height <= 640) {
    return hit.webformatURL;
  }
  
  // For larger sizes
  return hit.largeImageURL;
}

/**
 * Generate HTML for a Pixabay image with attribution
 * @param hit Pixabay image hit
 * @param width Desired width (optional)
 * @param height Desired height (optional)
 * @param alt Alt text (optional)
 * @returns HTML string with image and attribution
 */
export function generatePixabayImageHTML(
  hit: PixabayImageHit,
  width?: number,
  height?: number,
  alt?: string
): string {
  const imageUrl = width && height 
    ? getAppropriateImageSize(hit, width, height)
    : hit.webformatURL;
  
  const imageStyle = [];
  if (width) imageStyle.push(`width: ${width}px`);
  if (height) imageStyle.push(`height: ${height}px`);
  
  return `
    <div class="pixabay-image-container" style="position: relative;">
      <img 
        src="${imageUrl}" 
        alt="${alt || 'Image from Pixabay'}" 
        style="${imageStyle.join('; ')}; object-fit: cover;"
      />
      <div class="pixabay-attribution" style="font-size: 10px; text-align: right; opacity: 0.7;">
        Image by <a href="${hit.pageURL}" target="_blank">${hit.user}</a> on <a href="https://pixabay.com" target="_blank">Pixabay</a>
      </div>
    </div>
  `;
}

/**
 * Generate HTML for a Pixabay image as a slide background
 * @param hit Pixabay image hit
 * @returns HTML string for slide background
 */
export function generatePixabayBackgroundHTML(hit: PixabayImageHit): string {
  return `
    <section data-background="${hit.largeImageURL}" data-background-opacity="0.7">
      <div style="background-color: rgba(0,0,0,0.6); padding: 20px; border-radius: 10px;">
        <h2>Your Slide Title</h2>
        <p>Your slide content goes here</p>
      </div>
      <div style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; color: white; opacity: 0.7;">
        Image by ${hit.user} on Pixabay
      </div>
    </section>
  `;
}

/**
 * Generate reveal.js compatible HTML for a Pixabay image
 * @param imageUrl URL of the Pixabay image
 * @param attribution Attribution text
 * @param width Desired width (optional)
 * @param height Desired height (optional)
 * @returns HTML string for reveal.js slide
 */
export function generateRevealJsPixabayImage(
  imageUrl: string,
  attribution: string,
  width?: number,
  height?: number
): string {
  const imageStyle = [];
  if (width) imageStyle.push(`width: ${width}px`);
  if (height) imageStyle.push(`height: ${height}px`);
  
  return `
    <div class="r-stretch" style="display: flex; flex-direction: column; align-items: center;">
      <img 
        src="${imageUrl}" 
        alt="Pixabay Image" 
        style="${imageStyle.join('; ')}; max-width: 100%; max-height: 70vh; object-fit: contain;"
      />
      <div style="font-size: 12px; margin-top: 10px; opacity: 0.7; align-self: flex-end;">
        ${attribution}
      </div>
    </div>
  `;
} 