import {
  streamObject,
  LanguageModel,
  CoreMessage,
} from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { htmlTemplate as defaultHtmlTemplate } from '@/lib/template'
import { artifactSchema } from '@/lib/schema'
import { PresentationSlide } from '@/lib/gemini-functions';
import { ImageSearchQuery } from '@/lib/gemini-functions';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Mark route as dynamic for Vercel deployment
export const dynamic = 'force-dynamic';

// Default API key
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAjL409EbFBR1uiU1ziVpTk5qTD-yoZVeM';

// Default system prompt (content instructions only)
const DEFAULT_SYSTEM_PROMPT = `
  Create a comprehensive and engaging presentation with the following structure:
  1. An appealing cover slide with a clear title and subtitle
  2. An introduction slide that sets context
  3. Several content slides with well-organized bullet points, relevant data and insights
  4. A conclusion slide that summarizes key points
  5. A final slide with contact information or call to action

  Use professional language and ensure all content is well-structured and easy to follow.
  Make the content informative, engaging and visually descriptive.
  
  Charts and Diagrams:
  - You can generate data visualizations using Chart.js if the user requests them with "--charts"
  - You can create flowcharts and diagrams using Mermaid.js if the user requests them with "--flowchart"
  - For flowcharts, keep them simple with 5-7 nodes maximum for better readability
  - Each flowchart should be on its own dedicated slide with minimal other content
  - Use top-down (TD) orientation for flowcharts to fit better on slides
  - Charts and diagrams will be automatically sized to fit properly on slides
  
  Icons:
  - You can include Font Awesome 6 Free (Solid) icons if the user requests them
  - Use the format <i class="fas fa-[icon-name]"></i> to add icons
  - Icons can be styled with additional classes: icon-large, icon-medium, icon-small
  - Use icon-list class for lists with icons
  - Use icon-grid class for a grid layout of icons
  
  IMPORTANT INSTRUCTIONS FOR IMAGES:
  - DO NOT generate any image URLs yourself - generated URLs will not work in the presentation
  - DO NOT create any <img> tags with URLs you generate
  - DO NOT EVER use URLs from Wikipedia, Wikimedia, Pexels, Unsplash, Flickr, or any other site
  - DO NOT include any images unless they are explicitly provided to you
  - ONLY use the exact image URLs that I explicitly provide in my instructions
  - NEVER use your own knowledge of what image URLs might exist online
  - If I explicitly ask for images, I will provide them via special image suggestions
  - If no images are provided, create a text-only presentation
`;

interface Req {
  messages: CoreMessage[]
  apiKey?: string
  systemPrompt?: string
  htmlTemplate?: string
  autoSearchImages?: boolean
  imageSource?: string
}

interface ImageInfo {
  query: string;
  imageUrl: string;
  user: string;
  tags: string;
  source?: string;
}

// Function to search for images based on presentation topic using function calling
async function searchImagesForPresentation(topic: string, origin: string, apiKey: string, imageSource: string = 'pixabay') {
  try {
    console.log(`[IMAGE SEARCH DEBUG] Searching for images for topic: "${topic}" using ${imageSource}`);
    
    // Check if we have a valid API key for Gemini
    const hasGeminiApiKey = apiKey && apiKey.trim().length > 0;
    
    // Define the batchQueries array with explicit type
    let batchQueries: {
      q: string;
      imageType: string;
      orientation: string;
      minWidth: number;
      minHeight: number;
      perPage: number;
    }[] = [];
    
    if (hasGeminiApiKey) {
      // Try using function calling if we have a Gemini API key
      console.log(`[IMAGE SEARCH DEBUG] Using Gemini function calling for image search`);
      
      // Generate slides with image search queries using function calling
      const response = await fetch(`${origin}/api/generate-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, slideCount: 5 })
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`[PIXABAY DEBUG] Received slides data with ${responseData.slides?.length || 0} slides`);
        
        const { slides } = responseData as { slides: PresentationSlide[] };
        
        if (slides && Array.isArray(slides) && slides.length > 0) {
          // Log the first slide to see what we're getting
          console.log("[PIXABAY DEBUG] First slide:", JSON.stringify(slides[0], null, 2));
          
          // Prepare batch search queries from the structured data
          batchQueries = slides.flatMap((slide) => 
            (slide.searchQueries || []).map((searchQuery) => ({
              q: searchQuery.query,
              imageType: searchQuery.imageType || 'photo',
              orientation: searchQuery.orientation === 'square' ? 'horizontal' : (searchQuery.orientation || 'horizontal'),
              minWidth: 800,
              minHeight: 600,
              perPage: 3
            }))
          );
        }
      } else {
        const errorText = await response.text();
        console.error(`[PIXABAY DEBUG] Failed to generate slides with image queries: ${response.status} ${response.statusText}`);
        console.error(`[PIXABAY DEBUG] Error response: ${errorText}`);
      }
    } else {
      console.log(`[PIXABAY DEBUG] No Gemini API key available, skipping function calling`);
    }
    
    // If we have no valid queries (or function calling failed), use direct search as a fallback
    if (batchQueries.length === 0) {
      console.log(`[PIXABAY DEBUG] Using direct search fallback for topic: "${topic}"`);
      
      // Extract the main subject/theme from the topic - focus on relevant keywords
      // Remove common phrases like "create a presentation about" and "with images"
      const cleanTopic = topic
        .replace(/create\s+a\s+presentation\s+about\s*/i, '')
        .replace(/\s+with\s+images\s*/i, '')
        .replace(/\s+presentation\s*/i, '')
        .trim();
      
      // Split into keywords
      const keywords = cleanTopic.split(/\s+/);
      
      // Generate a few queries with different combinations
      batchQueries = [
        {
          q: cleanTopic,
          imageType: 'photo',
          orientation: 'horizontal',
          minWidth: 800,
          minHeight: 600,
          perPage: 5
        }
      ];
      
      // Add some more specific queries if we have multiple keywords
      if (keywords.length >= 2) {
        batchQueries.push({
          q: `${keywords[0]} ${keywords[1]}`,
          imageType: 'photo',
          orientation: 'horizontal',
          minWidth: 800,
          minHeight: 600,
          perPage: 3
        });
      }
    }
    
    console.log(`[PIXABAY DEBUG] Generated ${batchQueries.length} batch queries for image search`);
    console.log(`[PIXABAY DEBUG] First few queries:`, batchQueries.slice(0, 2));
    
    // Split queries into batches of 10 or fewer
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < batchQueries.length; i += batchSize) {
      batches.push(batchQueries.slice(i, i + batchSize));
    }
    
    console.log(`[PIXABAY DEBUG] Split into ${batches.length} batches of 10 or fewer queries`);
    
    // Process each batch
    const allResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[IMAGE SEARCH DEBUG] Processing batch ${i+1}/${batches.length} with ${batch.length} queries using ${imageSource}`);
      
      if (imageSource === 'pixabay') {
        // Search Pixabay
        const batchResponse = await fetch(`${origin}/api/pixabay/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queries: batch.map(q => ({
              q: q.q,
              image_type: q.imageType,
              orientation: q.orientation,
              min_width: q.minWidth,
              min_height: q.minHeight,
              per_page: q.perPage
            }))
          })
        });
        
        if (batchResponse.ok) {
          const batchResults = await batchResponse.json();
          allResults.push(...batchResults);
        } else {
          console.error(`[PIXABAY DEBUG] Batch search failed: ${batchResponse.status} ${batchResponse.statusText}`);
        }
      } else if (imageSource === 'wikimedia') {
        // Search Wikimedia Commons
        const batchResponse = await fetch(`${origin}/api/wikimedia/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queries: batch.map(q => ({
              q: q.q,
              limit: q.perPage,
              imageType: q.imageType,
              orientation: q.orientation
            }))
          })
        });
        
        if (batchResponse.ok) {
          const batchResults = await batchResponse.json();
          allResults.push(...batchResults);
        } else {
          console.error(`[WIKIMEDIA DEBUG] Batch search failed: ${batchResponse.status} ${batchResponse.statusText}`);
        }
      }
      
      console.log(`[IMAGE SEARCH DEBUG] Batch ${i+1} returned ${allResults.length} results`);
    }
    
    // Check if we got any valid images
    const hasValidImages = allResults.some(result => {
      if (imageSource === 'pixabay') {
        return result.result && result.result.hits && result.result.hits.length > 0;
      } else if (imageSource === 'wikimedia') {
        return result.result && result.result.images && result.result.images.length > 0;
      }
      return false;
    });
    
    // If no valid images were found, try a direct search with the main subject
    if (!hasValidImages && imageSource === 'wikimedia') {
      console.log(`[WIKIMEDIA DEBUG] No valid images found in batch search, trying direct search with main subject`);
      
      // Extract main subject (e.g., "Sachin Tendulkar" from "Sachin Tendulkar career in numbers")
      const mainSubject = topic.split(/\s+/).slice(0, 2).join(' ');
      
      // Try a direct search with just the main subject
      const directResponse = await fetch(`${origin}/api/wikimedia/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [{
            q: mainSubject,
            limit: 10,
            imageType: 'photo',
            orientation: 'horizontal'
          }]
        })
      });
      
      if (directResponse.ok) {
        const directResults = await directResponse.json();
        console.log(`[WIKIMEDIA DEBUG] Direct search returned ${directResults.length} results`);
        
        // Add the direct search results to our results
        allResults.push(...directResults);
      }
    }
    
    console.log(`[PROCESSOR] Found ${allResults.length} image search results`);
    
    return allResults;
  } catch (error) {
    console.error('[IMAGE SEARCH] Error searching for images:', error);
    return [];
  }
}

// Function to enhance system prompt with image suggestions
function enhancePromptWithImages(systemPrompt: string, imageResults: any, origin: string) {
  try {
    console.log(`[PROMPT] Enhancing prompt with images from search results`);
    
    // Check if the system prompt already contains instructions for manually added images
    const containsManualImages = systemPrompt.toLowerCase().includes('include this image in the presentation:') || 
                               systemPrompt.toLowerCase().includes('include these images in the presentation:');
    
    if (containsManualImages) {
      console.log(`[PROMPT] System prompt contains manually added images, preserving them`);
      // Don't add auto-searched images if manual images are present
      return systemPrompt;
    }
    
    // Process image results for inclusion in prompt
    const imageExamples: ImageInfo[] = [];
    
    // Process each search result
    for (const result of imageResults) {
      // Handle Pixabay results
      if (result && result.result && result.result.hits && result.result.hits.length > 0) {
        // Use up to 3 images per search query for more variety
        const useHits = Math.min(result.result.hits.length, 3);
        
        for (let i = 0; i < useHits; i++) {
          const hit = result.result.hits[i];
          
          // Add to examples
          imageExamples.push({
            query: result.query,
            imageUrl: hit.largeImageURL,
            user: hit.user,
            tags: hit.tags,
            source: 'Pixabay'
          });
        }
      }
      // Handle Wikimedia results
      else if (result && result.result && result.result.images && result.result.images.length > 0) {
        // Use up to 3 images per search query for more variety
        const useImages = Math.min(result.result.images.length, 3);
        
        for (let i = 0; i < useImages; i++) {
          const image = result.result.images[i];
          
          // Extract username from title if possible
          const titleMatch = image.title.match(/File:(.+?)(?:\s+by\s+(.+?))?(?:\.(jpe?g|png|gif|svg))?$/i);
          const user = titleMatch && titleMatch[2] ? titleMatch[2] : 'Wikimedia Commons';
          
          // Add to examples
          imageExamples.push({
            query: result.query,
            imageUrl: image.url,
            user: user,
            tags: image.title.replace(/^File:/, ''),
            source: 'Wikimedia Commons'
          });
        }
      }
    }
    
    // If we didn't find any images, return the original prompt
    if (imageExamples.length === 0) {
      console.log(`[PROMPT] No image examples found, using original prompt`);
      return systemPrompt;
    }
    
    console.log(`[PROMPT] Processed ${imageExamples.length} image examples for prompt`);
    
    // Limit to a reasonable number of examples to avoid overwhelming the prompt
    const maxImages = 4;
    const selectedImages = imageExamples.slice(0, maxImages);
    
    // Format image examples for inclusion in the prompt
    const formattedImageExamples = selectedImages
      .map((example, index) => {
        return `Image ${index + 1}:
- Query: "${example.query}"
- URL: ${example.imageUrl}
- Credit: ${example.user} on ${example.source || 'Pixabay'}
- Tags: ${example.tags}`;
      })
      .join('\n\n');
    
    // Create enhanced prompt with better guidance
    return `
${systemPrompt.trim()}

AVAILABLE IMAGES FOR THIS PRESENTATION:
${formattedImageExamples}

IMAGE USAGE INSTRUCTIONS:
1. USE ONLY the images listed above - no external sources
2. Insert images using HTML: <img src="THE_EXACT_URL_PROVIDED" alt="Brief description" />
3. USE DIFFERENT IMAGES FOR EACH SLIDE - do not repeat the same image multiple times
4. Match images to slide content - choose the most relevant image for each slide's topic
5. Position images appropriately within the slides
6. Give credit to the creators by including their name in a small caption or at the end
7. DO NOT modify the image URLs in any way
8. DO NOT use any images from Wikipedia or other external sources

Example of correct image usage:
<section>
  <h2>Slide Title</h2>
  <img src="${selectedImages[0]?.imageUrl || 'https://example.com/image.jpg'}" alt="${selectedImages[0]?.query || 'Example'}" style="max-width: 80%; height: auto;" />
  <p>Slide content goes here...</p>
  <p class="image-caption">Image by ${selectedImages[0]?.user || 'User'} on ${selectedImages[0]?.source || 'Pixabay'}</p>
</section>

IMPORTANT: The most visually appealing presentations use AT MOST ONE IMAGE PER SLIDE.
Distribute the ${maxImages} available images across your slides, using the most relevant image for each slide's content.
`;
  } catch (error) {
    console.error('[PROMPT] Error enhancing prompt with images:', error);
    return systemPrompt;
  }
}

// Function to validate and sanitize image URLs in the generated HTML
function sanitizeGeneratedHtml(generatedObject: any, validImageUrls: string[], origin: string): any {
  try {
    // If we have no valid image URLs, there's nothing to sanitize
    if (!validImageUrls || validImageUrls.length === 0) {
      console.log(`[SANITIZER] No valid image URLs to use for sanitization`);
      return generatedObject;
    }

    console.log(`[SANITIZER] Sanitizing HTML with ${validImageUrls.length} valid image URLs`);
    
    // Get the generated HTML - check different possible field names
    let html = '';
    if (generatedObject.html) {
      html = generatedObject.html;
    } else if (generatedObject.code) {
      html = generatedObject.code;
    } else if (typeof generatedObject === 'string') {
      html = generatedObject;
    }

    if (!html) {
      console.log(`[SANITIZER] No HTML content found to sanitize`);
      return generatedObject;
    }
    
    // Check if the HTML contains manually added images
    // If so, we should preserve those and not replace them
    const containsManualImages = html.includes('include this image in the presentation:') || 
                               html.includes('include these images in the presentation:');
    
    if (containsManualImages) {
      console.log(`[SANITIZER] HTML contains manually added images, preserving them`);
      // We'll still validate other images, but we'll be more careful about replacements
    }
    
    // Track how many times we've replaced or verified images
    let imageReplacements = 0;
    let validImageFound = 0;
    let externalImageRemoved = 0;
    
    // Validate image URLs to ensure they have proper image extensions
    const validatedImageUrls = validImageUrls.filter(url => {
      // Check if URL has a valid image extension
      const hasValidExtension = /\.(jpe?g|png|gif|svg|webp)$/i.test(url);
      
      if (!hasValidExtension) {
        console.log(`[SANITIZER] Filtered out non-image URL: ${url.substring(0, 100)}...`);
      }
      
      return hasValidExtension;
    });
    
    if (validatedImageUrls.length < validImageUrls.length) {
      console.log(`[SANITIZER] Filtered out ${validImageUrls.length - validatedImageUrls.length} non-image URLs`);
    }
    
    // If we have no valid image URLs after filtering, return the original object
    if (validatedImageUrls.length === 0) {
      console.log(`[SANITIZER] No valid image URLs left after filtering`);
      return generatedObject;
    }
    
    // 1. Convert Markdown image syntax to HTML
    // Match Markdown image syntax: ![alt text](image url)
    const markdownImageRegex = /!\[(.*?)\]\((.*?)\)/g;
    html = html.replace(markdownImageRegex, (match: string, alt: string, url: string) => {
      // Check if the URL is one of our valid Pixabay URLs
      const isValidUrl = validatedImageUrls.includes(url);
      
      // Check if this is part of a manually added image section
      const isInManualSection = containsManualImages && 
        html.indexOf(match) > html.indexOf('include this image in the presentation:');
      
      if (isValidUrl || isInManualSection) {
        validImageFound++;
        return `<div class="image-container"><img src="${url}" alt="${alt}" class="presentation-image" /><p class="image-caption">Image credit</p></div>`;
      } else {
        // Not a valid URL, replace with one of our valid ones
        console.warn(`[SANITIZER] Found invalid image URL in Markdown: ${url}`);
        const replacementUrl = validatedImageUrls[imageReplacements % validatedImageUrls.length];
        imageReplacements++;
        externalImageRemoved++;
        return `<div class="image-container"><img src="${replacementUrl}" alt="${alt}" class="presentation-image" /><p class="image-caption">Image credit</p></div>`;
      }
    });
    
    // 2. Check existing <img> tags
    const imgTagRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
    html = html.replace(imgTagRegex, (match: string, url: string) => {
      // Check if the URL is one of our valid image URLs
      const isValidUrl = validatedImageUrls.includes(url);
      
      // Check if this is part of a manually added image section
      const isInManualSection = containsManualImages && 
        html.indexOf(match) > html.indexOf('include this image in the presentation:');
      
      if (isValidUrl || isInManualSection) {
        validImageFound++;
        // Extract the alt text from the original tag if possible
        const altMatch = match.match(/alt="([^"]+)"/i);
        const alt = altMatch ? altMatch[1] : "Presentation image";
        
        // Replace with properly styled image
        return `<img src="${url}" alt="${alt}" class="presentation-image" />`;
      } else {
        // URL is not from our valid list, replace with one of our valid ones
        console.warn(`[SANITIZER] Found invalid image URL in HTML: ${url}`);
        const replacementUrl = validatedImageUrls[imageReplacements % validatedImageUrls.length];
        imageReplacements++;
        externalImageRemoved++;
        
        // Extract the alt text from the original tag if possible
        const altMatch = match.match(/alt="([^"]+)"/i);
        const alt = altMatch ? altMatch[1] : "Presentation image";
        
        return `<img src="${replacementUrl}" alt="${alt}" class="presentation-image" />`;
      }
    });
    
    // 3. Check for Wikipedia/Wikimedia/external images and replace them
    const wikiImageRegex = /https?:\/\/(upload\.wikimedia\.org|commons\.wikimedia\.org|[^"']+\.wiki[mp]edia\.org)[^"'\s]+/gi;
    html = html.replace(wikiImageRegex, (match: string) => {
      // Only replace if it's not already in our valid URLs and not in a manual section
      const isInManualSection = containsManualImages && 
        html.indexOf(match) > html.indexOf('include this image in the presentation:');
        
      if (!validatedImageUrls.includes(match) && !isInManualSection) {
        console.warn(`[SANITIZER] Found Wikipedia/Wikimedia URL: ${match}`);
        const replacementUrl = validatedImageUrls[imageReplacements % validatedImageUrls.length];
        imageReplacements++;
        externalImageRemoved++;
        return replacementUrl;
      }
      return match;
    });
    
    // 4. Check for other external image sources and replace them
    const externalImageRegex = /https?:\/\/(images\.unsplash\.com|img\.freepik\.com|cdn\.pixabay\.com|images\.pexels\.com)[^"'\s]+/gi;
    html = html.replace(externalImageRegex, (match: string) => {
      // Only replace if it's not already in our valid URLs and not in a manual section
      const isInManualSection = containsManualImages && 
        html.indexOf(match) > html.indexOf('include this image in the presentation:');
        
      if (!validatedImageUrls.includes(match) && !isInManualSection) {
        console.warn(`[SANITIZER] Found external image URL: ${match}`);
        const replacementUrl = validatedImageUrls[imageReplacements % validatedImageUrls.length];
        imageReplacements++;
        externalImageRemoved++;
        return replacementUrl;
      }
      return match;
    });
    
    // 5. Remove containers that don't contain valid images
    // This helps clean up the presentation when invalid images were removed
    const containerRegex = /<div class="container">([\s\S]*?)<\/div>/gi;
    html = html.replace(containerRegex, (match: string) => {
      // Check if the container has any img tags
      if (match.includes('<img')) {
        return match; // Keep containers with images
      } else {
        // Remove empty containers
        return '';
      }
    });
    
    console.log(`[SANITIZER] Sanitization complete: Found ${validImageFound} valid images, replaced ${externalImageRemoved} external images`);
    
    // Update the generated object with the sanitized HTML
    if (generatedObject.html) {
      generatedObject.html = html;
    } else if (generatedObject.code) {
      generatedObject.code = html;
    } else if (typeof generatedObject === 'string') {
      return html;
    }
    
    return generatedObject;
  } catch (error) {
    console.error('[SANITIZER] Error sanitizing HTML:', error);
    return generatedObject;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      apiKey = DEFAULT_API_KEY, 
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      htmlTemplate = defaultHtmlTemplate,
      autoSearchImages = false,
      imageSource = 'pixabay'
    } = body as Req;

    // Check if API key is provided
    if (!apiKey.trim()) {
      return new Response(JSON.stringify({ error: 'API key is required. Please enter your Google Gemini API key in the settings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract topic from the last message
    const lastMsg = messages[messages.length - 1];
    const topicContent = lastMsg.content;

    // Convert the content to a string format that we can work with
    let topic = '';
    if (typeof topicContent === 'string') {
      topic = topicContent;
    } else if (Array.isArray(topicContent)) {
      // Handle array content by joining text parts
      topic = topicContent
        .map(part => {
          if (typeof part === 'string') return part;
          // Use a type guard to check if it's an object with a text property
          if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
            return part.text;
          }
          return '';
        })
        .join(' ');
    } else if (topicContent && typeof topicContent === 'object' && 'text' in topicContent && 
               typeof (topicContent as any).text === 'string') {
      // Handle object content with text property
      topic = (topicContent as any).text;
    } else {
      // Fallback for any other cases
      topic = String(topicContent || '');
    }

    console.log(`[PROCESSOR] Processing topic: "${topic}"`);
    
    // Check if the message contains keywords related to images
    const imageKeywords = [
      'image', 'images', 'picture', 'pictures', 'photo', 'photos', 'visual', 'visuals',
      'add image', 'add images', 'add picture', 'add pictures', 'add photo', 'add photos',
      'with image', 'with images', 'with picture', 'with pictures', 'with photo', 'with photos',
      'include image', 'include images', 'include picture', 'include pictures', 'include photo', 'include photos',
      'show image', 'show images', 'show picture', 'show pictures', 'show photo', 'show photos',
      'insert image', 'insert images', 'insert picture', 'insert pictures', 'insert photo', 'insert photos',
      'illustrate', 'illustration', 'illustrations', 'visual aid', 'visual aids'
    ];

    const lowerTopic = topic.toLowerCase();
    
    // Check if the message contains manually added image URLs
    const containsManualImageUrls = 
      lowerTopic.includes('include this image in the presentation:') || 
      lowerTopic.includes('include these images in the presentation:');
    
    // If manual images are added, we should use those instead of searching
    const hasManualImages = containsManualImageUrls;

    const containsImageKeywords = imageKeywords.some(keyword => 
      lowerTopic.includes(keyword.toLowerCase())
    );

    console.log(`[PROCESSOR] Message contains image keywords: ${containsImageKeywords}`);
    console.log(`[PROCESSOR] Message contains manual images: ${hasManualImages}`);
    console.log(`[PROCESSOR] autoSearchImages setting: ${autoSearchImages}`);

    // Force image search if topic seems to explicitly request images, but not if manual images are provided
    const forcedImageSearch = containsImageKeywords && !hasManualImages;

    // Decide if we should search images - only when autoSearchImages is enabled or user explicitly asks for images
    // But never search if manual images are provided
    const shouldSearchImages = (autoSearchImages || forcedImageSearch) && !hasManualImages;

    console.log(`[PROCESSOR] Should search for images: ${shouldSearchImages} (forced: ${forcedImageSearch}, manual: ${hasManualImages})`);

    // Search for images if enabled
    let imageResults = null;
    let foundValidImages = false;
    let validImageUrls: string[] = [];
    
    // Define origin here so it's available throughout the function
    const origin = new URL(req.url).origin;
    
    // Initialize enhancedSystemPrompt with the original system prompt
    let enhancedSystemPrompt = systemPrompt;
    
    // Check if the topic contains manually added images
    const hasManuallyAddedImages = 
      topic.toLowerCase().includes('include this image in the presentation:') || 
      topic.toLowerCase().includes('include these images in the presentation:');
    
    if (hasManuallyAddedImages) {
      console.log(`[PROCESSOR] Topic contains manually added images, skipping auto image search`);
      // Use the original system prompt with manually added images
      enhancedSystemPrompt = systemPrompt;
    } else if (shouldSearchImages) {
      try {
        // Search for images
        imageResults = await searchImagesForPresentation(topic, origin, apiKey, imageSource);
        
        // Extract valid image URLs
        validImageUrls = extractValidImageUrls(imageResults, origin);
        
        // If we didn't find any valid images with the specific queries, try a direct search with the main subject
        if (validImageUrls.length === 0 && imageSource === 'wikimedia') {
          console.log(`[PROCESSOR] No valid images found with specific queries, trying direct search with main subject`);
          
          // Extract main subject (e.g., "Sachin Tendulkar" from "Sachin Tendulkar career in numbers")
          const mainSubject = topic.split(/\s+/).slice(0, 2).join(' ');
          
          console.log(`[PROCESSOR] Searching for main subject: "${mainSubject}"`);
          
          // Direct search with the main subject
          const directResponse = await fetch(`${origin}/api/wikimedia?q=${encodeURIComponent(mainSubject)}&limit=5`);
          
          if (directResponse.ok) {
            const directResult = await directResponse.json();
            
            if (directResult.images && directResult.images.length > 0) {
              console.log(`[PROCESSOR] Found ${directResult.images.length} images with direct search`);
              
              // Add the direct search results to our valid URLs
              const directUrls = directResult.images
                .filter((img: any) => img.url && /\.(jpe?g|png|gif|svg|webp)$/i.test(img.url))
                .map((img: any) => img.url);
              
              validImageUrls = [...directUrls, ...validImageUrls];
              
              console.log(`[PROCESSOR] Added ${directUrls.length} direct search images to valid URLs`);
            }
          }
        }
        
        foundValidImages = validImageUrls.length > 0;
        
        if (foundValidImages) {
          console.log(`[PROCESSOR] Valid images found. First image URL: ${validImageUrls[0]}`);
          enhancedSystemPrompt = enhancePromptWithImages(systemPrompt, imageResults, origin);
        } else {
          console.log(`[PROCESSOR] No valid images found despite search`);
          enhancedSystemPrompt = systemPrompt;
        }
      } catch (error) {
        console.error(`[PROCESSOR] Error searching for images:`, error);
        enhancedSystemPrompt = systemPrompt;
      }
    } else {
      console.log(`[PROCESSOR] Image search disabled, using original system prompt`);
      enhancedSystemPrompt = systemPrompt;
    }

    // Use the provided API key
    const client = createGoogleGenerativeAI({ apiKey })('models/gemini-2.0-pro-exp-02-05')
    
    // Combine content instructions with HTML implementation instructions
    const finalSystemPrompt = `
      ${enhancedSystemPrompt.trim()}
      
      TECHNICAL IMPLEMENTATION:
      - Generate the presentation in HTML using reveal.js framework
      - Create at least 6 slides with beautiful design
      - IMPORTANT: Ensure text content fits properly on each slide and does not overflow or get cut off
      - Use concise bullet points and short paragraphs to prevent text overflow
      - Limit the amount of text on each slide to ensure readability
      - For images, use either:
        1. Markdown format: ![Image description](image_url)
        2. HTML format: <img src="image_url" alt="Image description">
      - Either format will work correctly in the presentation
      - Images will be automatically styled responsively to fit the slides
      - For attributions, add a <small> tag after the image with the credit information
      - Make sure image URLs are complete and valid
      - DO NOT create any image URLs yourself - this will result in broken images
      - If you use Pixabay images, ensure you use the complete URL as provided
      - Position images appropriately with text to create an attractive layout
      
      CHARTS AND DIAGRAMS IMPLEMENTATION:
      - If user requests charts (--charts), use Chart.js to implement them
      - For Chart.js, use this format:
        <div class="chart-container">
          <canvas class="chart" data-chart='{"type":"bar","data":{"labels":["Label1","Label2"],"datasets":[{"label":"Dataset","data":[10,20],"backgroundColor":"rgba(75,192,192,0.4)"}]}}' width="400" height="200"></canvas>
        </div>
      
      - If user requests flowcharts (--flowchart), use Mermaid.js to implement them
      - IMPORTANT: For flowcharts, create a dedicated slide with minimal other content
      - For Mermaid.js, use this EXACT format to ensure proper sizing:
        <section class="mermaid-slide">
          <h2>Flowchart Title</h2>
          <div class="mermaid">
            graph TD;
              A[Start] --> B[Process];
              B --> C[End];
          </div>
        </section>
      
      - Keep flowchart syntax simple and avoid overly complex diagrams
      - Use TD (top-down) orientation for most flowcharts to fit better on slides
      - Limit flowcharts to 5-7 nodes for better readability
      - Use clear, concise labels for each node
      
      FONT AWESOME ICONS IMPLEMENTATION:
      - If user requests icons, use Font Awesome 6 Free (Solid) icons
      - Use this format to add icons: <i class="fas fa-[icon-name]"></i>
      - Replace [icon-name] with valid Font Awesome icon names like: user, chart-bar, envelope, etc.
      - Common useful icons include:
        * fa-chart-line, fa-chart-pie, fa-chart-bar (for data)
        * fa-user, fa-users, fa-user-tie (for people)
        * fa-lightbulb, fa-brain (for ideas)
        * fa-check, fa-times, fa-exclamation (for status)
        * fa-arrow-right, fa-arrow-down (for flow)
        * fa-envelope, fa-phone (for contact)
      - Add size classes for different icon sizes:
        * icon-large: <i class="fas fa-user icon-large"></i>
        * icon-medium: <i class="fas fa-user icon-medium"></i>
        * icon-small: <i class="fas fa-user icon-small"></i>
      - For lists with icons, use:
        <ul class="icon-list">
          <li><i class="fas fa-check"></i> Item one</li>
          <li><i class="fas fa-check"></i> Item two</li>
        </ul>
      - For a grid of icons, use:
        <div class="icon-grid">
          <i class="fas fa-user"></i>
          <i class="fas fa-cog"></i>
          <i class="fas fa-chart-bar"></i>
        </div>
      
      - Ensure charts and diagrams are properly sized using the existing CSS classes
      - Do not overflow slides with too much content
      - Follow this HTML template structure exactly:
      ${htmlTemplate}
    `;
    
    const stream = await streamObject({
      model: client as LanguageModel,
      schema: artifactSchema,
      system: finalSystemPrompt,
      messages
    })

    // Create a TransformStream to sanitize the generated HTML
    const { readable, writable } = new TransformStream({
      transform: async (chunk, controller) => {
        try {
          // Parse the chunk as JSON
          const data = JSON.parse(chunk);
          
          // Sanitize the HTML if it's a complete object
          if (data && typeof data === 'object' && data.code) {
            const sanitized = sanitizeGeneratedHtml(data, validImageUrls, origin);
            controller.enqueue(JSON.stringify(sanitized));
          } else {
            // Pass through other chunks unchanged
            controller.enqueue(chunk);
          }
        } catch (error) {
          // If we can't parse the chunk as JSON, pass it through unchanged
          controller.enqueue(chunk);
        }
      }
    });

    // Pipe the stream through our transform
    stream.toTextStreamResponse().body?.pipeTo(writable);
    
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper function to extract valid image URLs from search results
function extractValidImageUrls(imageResults: any[], origin: string): string[] {
  if (!imageResults || !Array.isArray(imageResults)) {
    console.log(`[PROCESSOR] extractValidImageUrls: No image results provided`);
    return [];
  }

  console.log(`[DEBUG] extractValidImageUrls: Processing ${imageResults.length} results`);
  if (imageResults.length > 0 && imageResults[0].query) {
    console.log(`[DEBUG] First result query: ${imageResults[0].query}`);
  }
  
  const validUrls: string[] = [];
  const imageMetadata: { url: string, title: string, source: string, relevance?: number }[] = [];
  
  imageResults.forEach((result: any, index: number) => {
    if (!result) {
      console.log(`[DEBUG] Result ${index} is null or undefined`);
      return;
    }
    
    // Check if this is a Pixabay result (has hits array)
    if (result.result && result.result.hits && Array.isArray(result.result.hits)) {
      console.log(`[DEBUG] Processing Pixabay result with ${result.result.hits.length} hits`);
      result.result.hits.forEach((hit: any) => {
        if (hit && hit.largeImageURL) {
          validUrls.push(hit.largeImageURL);
          imageMetadata.push({
            url: hit.largeImageURL,
            title: hit.tags || 'Pixabay Image',
            source: 'pixabay'
          });
        }
      });
    } 
    // Check if this is a Wikimedia Commons result (has images array)
    else if (result.result && result.result.images && Array.isArray(result.result.images)) {
      console.log(`[DEBUG] Processing Wikimedia result with ${result.result.images.length} images`);
      
      // Only process images that are actual image files (not PDFs, etc.)
      const validImages = result.result.images.filter((image: any) => {
        return image && image.url && (!image.mimeType || image.mimeType.startsWith('image/'));
      });
      
      if (validImages.length !== result.result.images.length) {
        console.log(`[DEBUG] Filtered out ${result.result.images.length - validImages.length} non-image files`);
      }
      
      validImages.forEach((image: any) => {
        if (image && image.url) {
          // Check if the image URL contains common file extensions
          const isValidImageUrl = /\.(jpe?g|png|gif|svg|webp)$/i.test(image.url);
          
          if (isValidImageUrl) {
            validUrls.push(image.url);
            imageMetadata.push({
              url: image.url,
              title: image.title || 'Wikimedia Image',
              source: 'wikimedia',
              relevance: image.relevanceScore
            });
            console.log(`[DEBUG] Added Wikimedia image URL: ${image.url.substring(0, 100)}...`);
          } else {
            console.log(`[DEBUG] Skipped Wikimedia URL with invalid extension: ${image.url.substring(0, 100)}...`);
          }
        } else {
          console.log(`[DEBUG] Invalid Wikimedia image - missing url property`);
        }
      });
    } 
    else {
      console.log(`[PROCESSOR] extractValidImageUrls: Result at index ${index} has no valid hits or images`);
      // Debug the structure in a safe way
      try {
        const hasResult = !!result.result;
        const resultKeys = hasResult ? Object.keys(result.result || {}) : [];
        console.log(`[DEBUG] Invalid result structure - has result: ${hasResult}, result keys: ${resultKeys.join(', ')}`);
      } catch (e) {
        console.log(`[DEBUG] Error analyzing invalid result:`, e);
      }
    }
  });
  
  // If we didn't find any valid URLs, try to extract the main subject from the query
  if (validUrls.length === 0 && imageResults.length > 0 && imageResults[0].query) {
    console.log(`[DEBUG] No valid images found, trying to extract main subject from query`);
    
    // Get the first query
    const firstQuery = imageResults[0].query;
    
    // Extract the main subject (usually the first 1-2 words)
    const mainSubject = firstQuery.split(/\s+/).slice(0, 2).join(' ');
    
    console.log(`[DEBUG] Extracted main subject: "${mainSubject}" from query: "${firstQuery}"`);
    
    // Add a note that we'll need to search for this subject separately
    console.log(`[DEBUG] No valid images found for the specific queries. Consider adding a fallback search for "${mainSubject}"`);
  }
  
  console.log(`[PROCESSOR] extractValidImageUrls: Found ${validUrls.length} valid image URLs`);
  if (validUrls.length > 0) {
    console.log(`[DEBUG] First valid URL: ${validUrls[0].substring(0, 100)}...`);
  }
  return validUrls;
}
