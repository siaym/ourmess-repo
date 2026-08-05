import type { AiAuthContext } from './auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Standardized logging utility for AI APIs.
 * Logs latency, endpoints, user, and mess IDs without sensitive data.
 */
export const aiLogger = {
  info: (message: string, meta: Record<string, any> = {}) => {
    // The specific format requested by the sprint requirements
    console.log(JSON.stringify({ 
      level: 'INFO', 
      message,
      User: meta.userId || 'Unknown',
      Question: meta.question || 'N/A',
      'API Called': meta.api || 'Unknown',
      'Response Time': `${meta.latencyMs || 0}ms`,
      Success: meta.success ?? true,
      Timestamp: new Date().toISOString(),
      ...meta 
    }));
  },
  error: (message: string, error: any, meta: Record<string, any> = {}) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      message,
      error: error?.message || error,
      User: meta.userId || 'Unknown',
      Question: meta.question || 'N/A',
      'API Called': meta.api || 'Unknown',
      'Response Time': `${meta.latencyMs || 0}ms`,
      Success: false,
      Timestamp: new Date().toISOString(),
      ...meta 
    }));
  }
};

/**
 * A wrapper for AI API Vercel Serverless Functions to standardise logging, error handling, and latency tracking.
 */
export function withAiApiHandler(
  handlerName: string,
  handler: (req: VercelRequest, res: VercelResponse, context: AiAuthContext) => Promise<any>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();
    let authContext: AiAuthContext | undefined;
    const question = req.headers['x-ai-question'] || 'N/A'; // Extract question if provided

    try {
      // Dynamic import to avoid circular dependencies if any
      const { getAiAuthContext, UnauthorizedError, ForbiddenError } = await import('./auth.js');
      
      authContext = await getAiAuthContext(req.headers.authorization);

      const result = await handler(req, res, authContext);
      
      const latencyMs = Date.now() - startTime;
      aiLogger.info(`AI API Success: ${handlerName}`, {
        api: handlerName,
        userId: authContext.userId,
        messId: authContext.messId,
        question,
        latencyMs,
        success: true
      });

      // If handler didn't already send a response (e.g. by returning data directly)
      if (!res.headersSent && result !== undefined) {
        return res.status(200).json(result);
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const { UnauthorizedError, ForbiddenError } = await import('./auth.js');

      if (error instanceof UnauthorizedError) {
        aiLogger.info(`AI API Unauthorized: ${handlerName}`, {
          api: handlerName,
          error: error.message,
          question,
          latencyMs,
          success: false
        });
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof ForbiddenError) {
        aiLogger.info(`AI API Forbidden: ${handlerName}`, {
          api: handlerName,
          userId: authContext?.userId,
          messId: authContext?.messId,
          error: error.message,
          question,
          latencyMs,
          success: false
        });
        return res.status(403).json({ error: error.message });
      }

      aiLogger.error(`AI API Internal Error: ${handlerName}`, error, {
        api: handlerName,
        userId: authContext?.userId,
        messId: authContext?.messId,
        question,
        latencyMs,
        success: false
      });
      
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
