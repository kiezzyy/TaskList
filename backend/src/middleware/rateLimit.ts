import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit({ windowMs, maxRequests }: { windowMs: number; maxRequests: number }) {
  return (request: Request, response: Response, next: NextFunction) => {
    const key = request.ip || 'local';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= maxRequests) {
      response.status(429).json({ message: 'Too many workspace operations. Please wait and try again.', details: [] });
      return;
    }

    bucket.count += 1;
    next();
  };
}
