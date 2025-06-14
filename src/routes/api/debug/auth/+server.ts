import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();
    
    console.log('🔍 Auth Debug Info:');
    console.log('- Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('- Header value:', authHeader);
    console.log('- Request body:', body);
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('- Token length:', token.length);
      console.log('- Token preview:', token.substring(0, 50) + '...');
      
      try {
        // Try to decode the token
        const tokenParts = token.split('.');
        console.log('- Token parts:', tokenParts.length);
        
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('- Token payload keys:', Object.keys(payload));
          console.log('- User ID (sub):', payload.sub);
          console.log('- User ID (user_id):', payload.user_id);
          console.log('- Expiry:', payload.exp);
          console.log('- Current time:', Math.floor(Date.now() / 1000));
          console.log('- Token expired?', payload.exp < Math.floor(Date.now() / 1000));
          
          return json({
            success: true,
            hasAuth: true,
            tokenValid: true,
            userId: payload.sub || payload.user_id,
            expired: payload.exp < Math.floor(Date.now() / 1000),
            payload: {
              sub: payload.sub,
              user_id: payload.user_id,
              exp: payload.exp,
              iat: payload.iat
            }
          });
        } else {
          return json({
            success: true,
            hasAuth: true,
            tokenValid: false,
            error: 'Invalid token format'
          });
        }
      } catch (error) {
        console.log('- Token decode error:', error);
        return json({
          success: true,
          hasAuth: true,
          tokenValid: false,
          error: error.message
        });
      }
    } else {
      return json({
        success: true,
        hasAuth: false,
        error: 'No authorization header'
      });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};
