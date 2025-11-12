import { redirect } from '@sveltejs/kit';

export function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'no-store, max-age=0'
  });
  throw redirect(307, '/auth-v4?mode=login');
}
