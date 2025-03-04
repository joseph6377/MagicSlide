// import { supabase } from '@/lib/supabase';

// No need for file upload, we'll just return a data URL
export async function POST(req: Request) {
  const { artifact } = await req.json()
  
  // Create a data URL from the HTML content
  const base64EncodedHtml = Buffer.from(artifact.code).toString('base64')
  const dataUrl = `data:text/html;base64,${base64EncodedHtml}`

  // Send file URL back to client
  return new Response(JSON.stringify({
    url: dataUrl
  }))
}
