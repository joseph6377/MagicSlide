import { PixabayImageHit } from './pixabay';

/**
 * Interface for slide content
 */
export interface SlideContent {
  title: string;
  content: string;
  index: number;
  type?: 'cover' | 'content' | 'conclusion';
}

/**
 * Interface for image search query
 */
export interface ImageSearchQuery {
  q: string;
  imageType?: 'all' | 'photo' | 'illustration' | 'vector';
  orientation?: 'all' | 'horizontal' | 'vertical';
  minWidth?: number;
  minHeight?: number;
  editorsChoice?: boolean;
}

/**
 * Interface for image search result
 */
export interface ImageSearchResult {
  query: string;
  result: {
    total: number;
    totalHits: number;
    hits: PixabayImageHit[];
  };
}

/**
 * Interface for slide with matched images
 */
export interface SlideWithImages extends SlideContent {
  suggestedImages: PixabayImageHit[];
  searchQueries: string[];
}

/**
 * Generate image search queries for a slide
 * @param slide Slide content
 * @returns Array of search queries
 */
export function generateQueriesForSlide(slide: SlideContent): ImageSearchQuery[] {
  const { title, content, type, index } = slide;
  const queries: ImageSearchQuery[] = [];
  
  // Extract key terms from the title and content
  const combinedText = `${title} ${content}`;
  const words = combinedText.toLowerCase().split(/\s+/);
  
  // Remove common words and punctuation
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of']);
  const keyTerms = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 2);
  
  // Create a frequency map of terms
  const termFrequency: Record<string, number> = {};
  keyTerms.forEach(term => {
    termFrequency[term] = (termFrequency[term] || 0) + 1;
  });
  
  // Sort terms by frequency
  const sortedTerms = Object.entries(termFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
  
  // Generate queries based on slide type
  if (type === 'cover' || index === 0) {
    // For cover slides, use broader, more visually appealing queries
    queries.push({
      q: `${title} concept`,
      imageType: 'photo',
      orientation: 'horizontal',
      editorsChoice: true,
      minWidth: 1920,
      minHeight: 1080
    });
    
    if (sortedTerms.length >= 2) {
      queries.push({
        q: `${sortedTerms[0]} ${sortedTerms[1]} professional`,
        imageType: 'photo',
        orientation: 'horizontal',
        editorsChoice: true
      });
    }
  } else if (type === 'conclusion' || index === -1) {
    // For conclusion slides, use summary-oriented images
    queries.push({
      q: `${title} summary`,
      imageType: 'photo',
      orientation: 'horizontal'
    });
    
    queries.push({
      q: `${title} conclusion concept`,
      imageType: 'illustration',
      orientation: 'horizontal'
    });
  } else {
    // For content slides, use more specific queries based on content
    if (sortedTerms.length >= 2) {
      queries.push({
        q: `${sortedTerms[0]} ${sortedTerms[1]}`,
        imageType: 'photo',
        orientation: 'horizontal'
      });
    }
    
    if (sortedTerms.length >= 3) {
      queries.push({
        q: `${sortedTerms[0]} ${sortedTerms[2]}`,
        imageType: 'illustration',
        orientation: 'horizontal'
      });
    }
    
    // Add a query with the slide title
    queries.push({
      q: title,
      imageType: 'all',
      orientation: 'all'
    });
  }
  
  return queries;
}

/**
 * Score an image for relevance to a slide
 * @param image Pixabay image
 * @param slide Slide content
 * @param query Search query used to find the image
 * @returns Relevance score (higher is better)
 */
export function scoreImageForSlide(
  image: PixabayImageHit, 
  slide: SlideContent, 
  query: string
): number {
  let score = 0;
  
  // Base score from Pixabay metrics
  score += Math.min(image.likes / 100, 10); // Up to 10 points for likes
  score += Math.min(image.downloads / 1000, 5); // Up to 5 points for downloads
  
  // Image quality and dimensions
  if (image.imageWidth >= 1920 && image.imageHeight >= 1080) {
    score += 5; // High resolution
  } else if (image.imageWidth >= 1280 && image.imageHeight >= 720) {
    score += 3; // Medium resolution
  }
  
  // Image type bonus
  if (slide.type === 'cover' && image.imageWidth > image.imageHeight) {
    score += 5; // Prefer landscape for cover slides
  }
  
  // Content relevance
  const combinedText = `${slide.title} ${slide.content}`.toLowerCase();
  const imageTags = image.tags.toLowerCase().split(',').map(tag => tag.trim());
  
  // Check if image tags match slide content
  imageTags.forEach(tag => {
    if (combinedText.includes(tag)) {
      score += 2; // Bonus for each matching tag
    }
  });
  
  // Query match bonus
  if (image.tags.toLowerCase().includes(query.toLowerCase())) {
    score += 3; // Bonus if the query appears in the tags
  }
  
  return score;
}

/**
 * Match images to slides based on content
 * @param slides Array of slide content
 * @param imageResults Array of image search results
 * @returns Array of slides with matched images
 */
export function matchImagesToSlides(
  slides: SlideContent[], 
  imageResults: ImageSearchResult[]
): SlideWithImages[] {
  return slides.map(slide => {
    // Flatten all image results into a single array with query info
    const allImages = imageResults.flatMap(result => 
      result.result.hits.map(hit => ({ 
        hit, 
        query: result.query 
      }))
    );
    
    // Score each image for this slide
    const scoredImages = allImages.map(({ hit, query }) => ({
      hit,
      query,
      score: scoreImageForSlide(hit, slide, query)
    }));
    
    // Sort by score (descending) and take the top 5
    const topImages = scoredImages
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Extract unique search queries used
    const searchQueries = Array.from(new Set(topImages.map(img => img.query)));
    
    // Return the slide with suggested images
    return {
      ...slide,
      suggestedImages: topImages.map(img => img.hit),
      searchQueries
    };
  });
}

/**
 * Extract slides from HTML content
 * @param html HTML content of the presentation
 * @returns Array of slide content
 */
export function extractSlidesFromHTML(html: string): SlideContent[] {
  const slides: SlideContent[] = [];
  
  // Regular expression to match slide sections
  const slideRegex = /<section[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  let index = 0;
  
  while ((match = slideRegex.exec(html)) !== null) {
    const slideContent = match[1];
    
    // Extract title (h1, h2, or h3)
    const titleMatch = slideContent.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : `Slide ${index + 1}`;
    
    // Extract content (everything except title)
    let content = slideContent.replace(/<h[1-3][^>]*>.*?<\/h[1-3]>/g, '');
    content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Determine slide type
    let type: 'cover' | 'content' | 'conclusion' = 'content';
    if (index === 0) {
      type = 'cover';
    } else if (
      content.toLowerCase().includes('conclusion') || 
      content.toLowerCase().includes('summary') || 
      content.toLowerCase().includes('thank you')
    ) {
      type = 'conclusion';
    }
    
    slides.push({
      title,
      content,
      index,
      type
    });
    
    index++;
  }
  
  return slides;
}

/**
 * Generate image search queries for a presentation
 * @param html HTML content of the presentation
 * @returns Array of image search queries
 */
export function generateQueriesForPresentation(html: string): ImageSearchQuery[] {
  const slides = extractSlidesFromHTML(html);
  
  // Generate queries for each slide
  const allQueries = slides.flatMap(slide => generateQueriesForSlide(slide));
  
  // Remove duplicate queries
  const uniqueQueries = allQueries.filter((query, index, self) => 
    index === self.findIndex(q => q.q === query.q)
  );
  
  return uniqueQueries;
} 