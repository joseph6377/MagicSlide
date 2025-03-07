import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Mark route as dynamic for Vercel deployment
export const dynamic = 'force-dynamic';

// Default API key
const DEFAULT_API_KEY = 'AIzaSyAjL409EbFBR1uiU1ziVpTk5qTD-yoZVeM';

interface QueryGenerationRequest {
  topic: string;
  slideCount?: number;
}

/**
 * POST handler for generating image search queries
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { topic, slideCount = 5 }: QueryGenerationRequest = await request.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get API key from cookies
    const apiKey = request.cookies.get('slidemagic-api-key')?.value || DEFAULT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please set your Google Gemini API key in the settings.' },
        { status: 400 }
      );
    }
    
    // Create the prompt for generating image search queries
    const prompt = `
      Generate ${slideCount} image search queries for a presentation about "${topic}".
      
      For each slide, provide:
      1. A short description of the slide content
      2. 2-3 specific image search queries that would find relevant, high-quality images for that slide
      3. Preferred image type (photo, illustration, or vector)
      4. Preferred orientation (horizontal or vertical)
      
      Format the response as a JSON array with objects containing:
      {
        "slideTitle": "Title of the slide",
        "slideDescription": "Brief description of slide content",
        "queries": ["query1", "query2", "query3"],
        "imageType": "photo|illustration|vector",
        "orientation": "horizontal|vertical"
      }
      
      Make the queries specific, descriptive, and diverse to cover different aspects of the topic.
      Ensure the first slide has a query for a compelling cover image.
    `;
    
    // Use the official Google Generative AI SDK directly
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content with the model
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract the JSON from the response
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                    responseText.match(/```\n([\s\S]*?)\n```/) ||
                    [null, responseText];
    
    let jsonText = jsonMatch[1] || responseText;
    
    // Parse the JSON
    let queries;
    
    try {
      queries = JSON.parse(jsonText);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      
      try {
        // Try to clean the text and parse again
        const cleanedText = jsonText
          .replace(/^```(json)?/, '')
          .replace(/```$/, '')
          .trim();
        
        queries = JSON.parse(cleanedText);
      } catch (error) {
        console.error('Error parsing cleaned JSON:', error);
        return NextResponse.json(
          { error: 'Failed to parse response from AI. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error generating image queries:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating image queries' },
      { status: 500 }
    );
  }
} 