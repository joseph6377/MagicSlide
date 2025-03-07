import { NextResponse } from 'next/server';
import ratelimit from '@/lib/ratelimit'

// Route config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Constants (not exported)
const rateLimitMaxRequests = 100;
const ratelimitWindow = '1d';

/**
 * GET handler for rate limit info
 */
export async function GET(req: Request) {
  const limit = await ratelimit(req.headers.get('x-forwarded-for'), rateLimitMaxRequests, ratelimitWindow)

  if (limit && !limit?.success) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString()
      }
    })
  }

  return new Response(JSON.stringify(limit))
}
