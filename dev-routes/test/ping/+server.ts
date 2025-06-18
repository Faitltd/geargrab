import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  console.log('🏓 Ping endpoint called');
  return json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
};

export const POST: RequestHandler = async ({ request }) => {
  console.log('🏓 Ping POST endpoint called');
  
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    console.log('No JSON body provided');
  }

  return json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    receivedBody: body
  });
};