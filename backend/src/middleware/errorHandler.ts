import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

interface HttpError extends Error {
  statusCode?: number;
  details?: string[];
}

export function errorHandler(error: HttpError, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Request validation failed',
      details: error.issues.map((issue) => sanitizeDetail(`${issue.path.join('.')}: ${issue.message}`))
    });
    return;
  }

  response.status(error.statusCode ?? 500).json({
    message: error.statusCode ? sanitizeDetail(error.message) : 'Unexpected server error',
    details: (error.details ?? []).map(sanitizeDetail)
  });
}

function sanitizeDetail(value: string) {
  return value
    .replace(/[A-Za-z]:\\[^\s"'<>]+/g, '[local-path]')
    .replace(/\/(?:Users|home|var|tmp)\/[^\s"'<>]+/g, '[local-path]');
}
