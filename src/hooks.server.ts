import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null;
  event.locals.userId = null;

  console.log(`Processing: ${event.request.method} ${event.url.pathname}`);

  // Minimal request processing for debugging
  const response = await resolve(event);

  console.log(`Response: ${response.status}`);

  return response;
};

export function handleError({ error, event }: { error: any, event: any }) {
  console.error('Server error:', {
    message: error?.message || 'Unknown error',
    path: event.url.pathname,
    method: event.request.method
  });

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}
