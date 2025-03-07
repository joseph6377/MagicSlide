import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { generatePresentationSlidesFunction, GeneratePresentationSlidesResponse, PresentationSlide } from '@/lib/gemini-functions';

// Mark route as dynamic for Vercel deployment
export const dynamic = 'force-dynamic';

// Default API key - using the one provided by the user
const DEFAULT_API_KEY = 'AIzaSyAjL409EbFBR1uiU1ziVpTk5qTD-yoZVeM';

interface SlideGenerationRequest {
  topic: string;
  slideCount?: number;
}

/**
 * POST handler for generating slides with image search queries
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { topic, slideCount = 5 }: SlideGenerationRequest = await request.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get API key from environment or use default
    const apiKey = process.env.GEMINI_API_KEY || DEFAULT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please set your Google Gemini API key in the settings.' },
        { status: 400 }
      );
    }
    
    console.log(`Generating slides for topic: "${topic}" with slideCount: ${slideCount}`);
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // For function calling, we need to use a model that supports it
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Create the prompt for generating slides with image search queries
    const prompt = `
      Create a presentation about "${topic}" with ${slideCount} slides.
      For each slide, provide:
      1. A clear and concise title
      2. A brief description of the slide content
      3. 2-4 specific image search queries that would find relevant images for this slide
      
      Make the queries specific, descriptive, and diverse to cover different aspects of the topic.
      Ensure the queries would return high-quality, relevant images when used with an image search API.
    `;
    
    console.log("Sending function calling request to Gemini API");
    console.log("Function declaration:", JSON.stringify(generatePresentationSlidesFunction, null, 2));
    
    // Generate content with function calling
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
      tools: [{
        functionDeclarations: [generatePresentationSlidesFunction] 
      }]
    } as any);
    
    const response = result.response;
    
    // Check if there's a function call in the response
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response");
      return NextResponse.json(
        { error: 'Failed to generate slides. No response from AI.' },
        { status: 500 }
      );
    }
    
    console.log("Response received from Gemini API");
    
    // Log the first part of the response to see what we're getting
    const firstPart = response.candidates[0].content.parts[0];
    console.log("Response first part type:", firstPart.functionCall ? "functionCall" : "text");
    
    const functionCall = response.candidates[0].content.parts[0].functionCall;
    
    if (!functionCall || functionCall.name !== "generatePresentationSlides") {
      console.error("Function call not found or incorrect name:", functionCall ? functionCall.name : "undefined");
      console.log("Response content:", JSON.stringify(response.candidates[0].content, null, 2));
      return NextResponse.json(
        { error: 'Failed to generate slides. Function call not found in response.' },
        { status: 500 }
      );
    }
    
    console.log("Function call found with name:", functionCall.name);
    
    // Parse the function call arguments
    try {
      // Check the type of slides data - it might be a string to parse or an object already
      let slidesData: GeneratePresentationSlidesResponse['slides'];
      
      const args = functionCall.args as { slides?: unknown };
      
      if (typeof args.slides === 'string') {
        // If it's a string, parse it as JSON
        slidesData = JSON.parse(args.slides);
      } else if (Array.isArray(args.slides)) {
        // If it's already an array, use it directly
        slidesData = args.slides as PresentationSlide[];
      } else {
        throw new Error('Invalid slides data format');
      }
      
      // Log the successfully parsed slides
      console.log(`Successfully parsed slides data with ${slidesData.length} slides`);
      console.log(`First slide: ${JSON.stringify(slidesData[0], null, 2)}`);
      
      // Return the generated slides
      return NextResponse.json({ slides: slidesData });
    } catch (error) {
      console.error("Error parsing function call arguments:", error);
      console.log("Raw function call args:", JSON.stringify(functionCall.args, null, 2));
      
      // Try a different approach if parsing fails
      try {
        // If functionCall.args is already an object with a slides property
        const args = functionCall.args as { slides?: unknown };
        if (args && Array.isArray(args.slides)) {
          console.log("Using slides array directly from args");
          return NextResponse.json({ slides: args.slides });
        }
      } catch (nestedError) {
        console.error("Nested error handling function call:", nestedError);
      }
      
      return NextResponse.json(
        { error: 'Failed to parse slides data from function call.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating slides:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating slides' },
      { status: 500 }
    );
  }
} 