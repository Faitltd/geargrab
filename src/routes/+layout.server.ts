import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Get user from locals (set by hooks.server.ts)
  const user = locals.user;
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/listings/new',
    '/listings/edit',
    '/profile',
    '/settings',
    '/sales'
  ];
  
  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  );
  
  // Determine if auth modal should be shown
  const showAuthModal = isProtectedRoute && !user;
  
  return {
    user: user ? {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      picture: user.picture
    } : null,
    showAuthModal,
    currentPath: url.pathname
  };
};
