import {
  streamObject,
  LanguageModel,
  CoreMessage,
} from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { htmlTemplate as defaultHtmlTemplate } from '@/lib/template'
import { artifactSchema } from '@/lib/schema'

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
`;

interface Req {
  messages: CoreMessage[]
  apiKey?: string
  systemPrompt?: string
  htmlTemplate?: string
}

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      apiKey = DEFAULT_API_KEY, 
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      htmlTemplate = defaultHtmlTemplate
    } = await req.json() as Req

    // Check if API key is provided
    if (!apiKey.trim()) {
      return new Response(JSON.stringify({ error: 'API key is required. Please enter your Google Gemini API key in the settings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use the provided API key
    const client = createGoogleGenerativeAI({ apiKey })('models/gemini-2.0-flash')
    
    // Combine content instructions with HTML implementation instructions
    const finalSystemPrompt = `
      ${systemPrompt.trim()}
      
      TECHNICAL IMPLEMENTATION:
      - Generate the presentation in HTML using reveal.js framework
      - Create at least 6 slides with beautiful design
      - Follow this HTML template structure exactly:
      ${htmlTemplate}
    `;
    
    const stream = await streamObject({
      model: client as LanguageModel,
      schema: artifactSchema,
      system: finalSystemPrompt,
      messages
    })

    return stream.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
