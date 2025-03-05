import {
  streamObject,
  LanguageModel,
  CoreMessage,
} from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { htmlTemplate as defaultHtmlTemplate } from '@/lib/template'
import { artifactSchema } from '@/lib/schema'
import { generateQueriesForPresentation } from '@/lib/slide-image-matcher';
import { ImageSearchQuery } from '@/lib/slide-image-matcher';

// Default API key - empty by default
const DEFAULT_API_KEY = '';

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
  
  IMPORTANT INSTRUCTIONS FOR IMAGES:
  - DO NOT generate any image URLs yourself - generated URLs will not work in the presentation
  - DO NOT create any <img> tags with URLs you generate
  - ONLY use the exact image URLs that the user has explicitly provided in their message
  - If the user mentions "Include these images in the presentation:", use ONLY these images
  - DO NOT modify or change any part of the image URLs provided by the user
  - Ignore any URLs from your own knowledge base - they will not work
  - If no images are provided by the user, do not include any images in the presentation
`;

interface Req {
  messages: CoreMessage[]
  apiKey?: string
  systemPrompt?: string
  htmlTemplate?: string
  autoSearchImages?: boolean
}

interface ImageInfo {
  query: string;
  imageUrl: string;
  user: string;
  tags: string;
}

// Function to search for images based on presentation topic
async function searchImagesForPresentation(topic: string, origin: string, apiKey: string) {
  try {
    // Generate queries for the topic
    const response = await fetch(`${origin}/api/generate-queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, slideCount: 5 })
    });
    
    if (!response.ok) {
      console.error('Failed to generate image queries:', await response.text());
      return null;
    }
    
    const queries = await response.json();
    
    // Prepare batch search queries
    const batchQueries = queries.flatMap((slide: any) => 
      slide.queries.map((q: string) => ({
        q,
        imageType: slide.imageType || 'photo',
        orientation: slide.orientation || 'horizontal',
        minWidth: 800,
        minHeight: 600,
        perPage: 3
      }))
    );
    
    // Search for images
    const searchResponse = await fetch(`${origin}/api/pixabay/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries: batchQueries })
    });
    
    if (!searchResponse.ok) {
      console.error('Failed to search for images:', await searchResponse.text());
      return null;
    }
    
    return await searchResponse.json();
  } catch (error) {
    console.error('Error searching for images:', error);
    return null;
  }
}

// Function to enhance system prompt with image suggestions
function enhancePromptWithImages(systemPrompt: string, imageResults: any, origin: string) {
  if (!imageResults || !Array.isArray(imageResults)) {
    return systemPrompt;
  }
  
  // Extract image information
  const imageInfo: ImageInfo[] = imageResults
    .map(result => {
      if (!result.result || !result.result.hits || result.result.hits.length === 0) {
        return null;
      }
      
      const bestImage = result.result.hits[0];
      return {
        query: result.query,
        imageUrl: bestImage.largeImageURL,
        user: bestImage.user,
        tags: bestImage.tags
      };
    })
    .filter((img): img is ImageInfo => img !== null);
  
  if (imageInfo.length === 0) {
    return systemPrompt;
  }
  
  // Add image suggestions to the prompt using a simpler format
  const imagePrompt = `
  SUGGESTED IMAGES:
  Below are images that you can use in your presentation. Insert them using this format:
  
  ![Image description](image_url)
  
  ${imageInfo.map((img, index) => {
    return `
  IMAGE ${index + 1}: "${img.query}"
  URL: ${img.imageUrl}
  Attribution: Image by ${img.user} on Pixabay
    `;
  }).join('\n')}
  
  CRITICAL INSTRUCTIONS:
  1. Use the format ![Image description](image_url) to insert images
  2. Replace "image_url" with the URL provided above
  3. DO NOT create your own image URLs - they will not work in the presentation
  4. DO NOT modify any part of the URL provided
  5. DO NOT use HTML div or img tags for images
  6. ONLY use the images provided above or explicitly provided by the user
  7. If none of the suggested images are suitable, do not include an image
  `;
  
  return systemPrompt + '\n\n' + imagePrompt;
}

// Function to validate and sanitize image URLs in the generated HTML
function sanitizeGeneratedHtml(generatedObject: any, validImageUrls: string[], origin: string): any {
  if (!generatedObject || !generatedObject.code || typeof generatedObject.code !== 'string') {
    return generatedObject;
  }

  let sanitizedHtml = generatedObject.code;

  // Convert Markdown image syntax to HTML with better responsive styling
  // This regex now matches our multi-line format with the URL on its own line
  const markdownImgRegex = /!\[(.*?)\]\(\s*\n?(.*?)\s*\n?\)(?:\s*<!--\s*(.*?)\s*-->)?/gm;
  sanitizedHtml = sanitizedHtml.replace(markdownImgRegex, (match: string, alt: string, src: string, attribution?: string): string => {
    // Trim any whitespace from the URL
    const trimmedSrc = src.trim();
    
    const attributionHtml = attribution 
      ? `<p><small>${attribution}</small></p>` 
      : '';
    
    return `<img alt="${alt}" src="${trimmedSrc}" class="slide-image" style="max-width: 75%; max-height: 60vh; object-fit: contain; margin: 0 auto; display: block;">
    ${attributionHtml}`;
  });
  
  // Remove any of our custom pixabay-reference divs - they're just for the editor UI
  const pixabayRefRegex = /<div class="pixabay-reference">([\s\S]*?)<\/div>/gm;
  sanitizedHtml = sanitizedHtml.replace(pixabayRefRegex, '$1');

  // Also improve styling for existing img tags
  const imgRegex = /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
  sanitizedHtml = sanitizedHtml.replace(imgRegex, (match: string, before: string, src: string, after: string): string => {
    // Don't modify if it's one of our newly added images with the slide-image class
    if (match.includes('class="slide-image"')) {
      return match;
    }
    
    // Extract any existing alt text
    const altMatch = match.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : 'Slide image';
    
    // Keep any existing classes
    const classMatch = match.match(/class=["']([^"']*)["']/i);
    const existingClasses = classMatch ? classMatch[1] + ' ' : '';
    
    return `<img alt="${alt}" src="${src}" class="${existingClasses}slide-image" style="max-width: 75%; max-height: 60vh; object-fit: contain; margin: 0 auto; display: block;">`;
  });
  
  // Find all image tags and check if their URLs are valid
  const finalImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  // Find all image tags and check if their URLs are valid
  while ((match = finalImgRegex.exec(sanitizedHtml)) !== null) {
    const fullImgTag = match[0];
    const imgUrl = match[1];
    
    // Check if this is a direct Pixabay URL
    const isPixabayUrl = imgUrl.includes('pixabay.com') || imgUrl.includes('cdn.pixabay.com');
    
    // Use Pixabay URLs directly - they should work with the new format
    if (isPixabayUrl) {
      console.log('Using direct Pixabay URL:', imgUrl);
    }
    // If it's not a valid URL from our list, log a warning but don't remove it
    else if (!validImageUrls.some(validUrl => imgUrl.includes(validUrl))) {
      console.warn('Potentially invalid image URL:', imgUrl);
    }
  }
  
  // Add custom CSS for images in the head section
  if (sanitizedHtml.includes('</head>')) {
    const customCSS = `
    <style>
      .reveal .slide-image {
        max-width: 75%;
        max-height: 60vh;
        object-fit: contain;
        margin: 0 auto;
        border: none !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.3s ease-in-out;
      }
      .reveal .slide-image:hover {
        transform: scale(1.02);
      }
      .reveal .slides section p small {
        opacity: 0.6;
        font-size: 0.6em;
        display: block;
        margin-top: 8px;
      }
      
      /* Prevent text overflow in slides */
      .reveal .slides section {
        text-overflow: ellipsis;
        overflow: hidden;
        height: 100%;
      }
      .reveal .slides section h1,
      .reveal .slides section h2,
      .reveal .slides section h3 {
        margin-bottom: 0.5em;
        word-wrap: break-word;
      }
      .reveal .slides section p,
      .reveal .slides section li {
        font-size: 0.9em;
        line-height: 1.4;
        margin-bottom: 0.5em;
      }
      .reveal .slides section ul,
      .reveal .slides section ol {
        display: block;
        margin-bottom: 0.5em;
      }
    </style>`;
    
    sanitizedHtml = sanitizedHtml.replace('</head>', customCSS + '</head>');
  }
  
  // Update the code in the generated object
  return {
    ...generatedObject,
    code: sanitizedHtml
  };
}

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      apiKey = DEFAULT_API_KEY, 
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      htmlTemplate = defaultHtmlTemplate,
      autoSearchImages = false  // Always set to false to disable auto image search
    } = await req.json() as Req

    // Check if API key is provided
    if (!apiKey.trim()) {
      return new Response(JSON.stringify({ error: 'API key is required. Please enter your Google Gemini API key in the settings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract the presentation topic from the user's message
    const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
    const topic = typeof userMessage === 'string' 
      ? userMessage 
      : Array.isArray(userMessage) 
        ? userMessage.map(part => typeof part === 'string' ? part : '').join(' ')
        : '';
    
    // Use the autoSearchImages parameter passed in to determine if we should search for images
    const shouldSearchImages = autoSearchImages && topic.length > 0;
    
    // Search for images if enabled
    let enhancedSystemPrompt = systemPrompt;
    let validImageUrls: string[] = [];
    
    // Define origin here so it's available throughout the function
    const origin = new URL(req.url).origin;
    
    if (shouldSearchImages) {
      const imageResults = await searchImagesForPresentation(topic, origin, apiKey);
      
      if (imageResults) {
        // Extract valid image URLs for later validation
        validImageUrls = imageResults
          .filter((result: any) => result.result && result.result.hits && result.result.hits.length > 0)
          .map((result: any) => result.result.hits[0].largeImageURL);
        
        enhancedSystemPrompt = enhancePromptWithImages(systemPrompt, imageResults, origin);
      }
    } else {
      // When auto search images is disabled, add explicit instructions to not add any images
      enhancedSystemPrompt = `
${systemPrompt.trim()}

IMPORTANT IMAGE INSTRUCTIONS:
- DO NOT include any images in the presentation
- DO NOT generate any image URLs, links, or placeholders
- DO NOT add any <img> tags or Markdown image syntax
- Create a text-only presentation with no visual media
- If the user explicitly mentions images in their prompt, you may ONLY use those specific images
`;
    }

    // Use the provided API key
    const client = createGoogleGenerativeAI({ apiKey })('models/gemini-2.0-flash')
    
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
