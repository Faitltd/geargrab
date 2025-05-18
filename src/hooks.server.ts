import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals with dummy user data for development
  event.locals.user = null;
  event.locals.userId = null;

  const start = Date.now();

  // For now, we're not implementing authentication
  // This will be replaced with actual Firebase authentication later

  const response = await resolve(event);

  const duration = Date.now() - start;
  const logData = {
    path: event.url.pathname,
    method: event.request.method,
    status: response.status,
    duration
  };

  if (response.status >= 400) {
    console.error('Request error', logData);
  } else {
    console.log('Request processed', logData);
  }

  return response;
};

export function handleError({ error, event }) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    path: event.url.pathname,
    method: event.request.method,
    timestamp: new Date().toISOString()
  };

  console.error(JSON.stringify(errorReport));

  return {
    message: 'An unexpected error occurred',
    code: error.code || 'UNKNOWN'
  };
}
