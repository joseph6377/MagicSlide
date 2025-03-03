import {
  streamObject,
  LanguageModel,
  CoreMessage,
} from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { htmlTemplate } from '@/lib/template'
import { artifactSchema } from '@/lib/schema'

// Default API key from environment
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || '';

interface Req {
  messages: CoreMessage[]
  apiKey?: string
}

export async function POST(req: Request) {
  try {
    const { messages, apiKey = DEFAULT_API_KEY } = await req.json() as Req

    // Use the provided API key if available, otherwise use the default one
    const client = createGoogleGenerativeAI({ apiKey })('models/gemini-2.0-flash')
    const stream = await streamObject({
      model: client as LanguageModel,
      schema: artifactSchema,
      system: `
        Generate a visually appealing presentation in HTML using reveal.js framework.
        The presentation should include the following slides: appealing cover, bullet points with links, conclusion and end page.
        Create more than 6 slides with beautiful design.
        This is for SlideMagic AI.
        Use the template: ${htmlTemplate}
      `,
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
