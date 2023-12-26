import { ipAddress, next } from '@vercel/edge'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  // 1 requests from the same IP in 5 seconds
  limiter: Ratelimit.slidingWindow(1, '5 s'),
})

// Define which routes you want to rate limit
export const config = {
  matcher: '/',
}

export default async function middleware(request: Request) {
  // You could alternatively limit based on user ID or similar
  const ip = ipAddress(request) || '127.0.0.1'
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip
  )
  
  if (success) next();

  throw new Error("Rate Limit Hit");
}
