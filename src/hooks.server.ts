import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals with dummy user data for development
  event.locals.user = null;
  event.locals.userId = null;

  // For now, we're not implementing authentication
  // This will be replaced with actual Firebase authentication later

  return resolve(event);
};
