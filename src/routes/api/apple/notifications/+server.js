import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

// Cache for Apple's public keys
let appleKeys = null;
let keysLastFetched = 0;
const KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch Apple's JSON Web Key Set (JWKS)
 * Cached for 24 hours to avoid excessive requests
 */
async function getAppleKeys() {
  const now = Date.now();
  
  if (!appleKeys || (now - keysLastFetched) > KEYS_CACHE_DURATION) {
    try {
      console.log('🔄 Fetching Apple JWKS...');
      const response = await fetch('https://appleid.apple.com/auth/keys');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple keys: ${response.status}`);
      }
      
      const data = await response.json();
      appleKeys = data.keys;
      keysLastFetched = now;
      
      console.log('✅ Apple JWKS fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch Apple keys:', error);
      throw error;
    }
  }
  
  return appleKeys;
}

/**
 * Convert JWK to PEM format for JWT verification
 */
function jwkToPem(jwk) {
  // This is a simplified conversion - in production you might want to use a library like 'jwk-to-pem'
  const { n, e } = jwk;
  
  // For now, we'll use a basic approach
  // In production, consider using the 'jwk-to-pem' npm package
  const modulus = Buffer.from(n, 'base64');
  const exponent = Buffer.from(e, 'base64');
  
  // Create a basic PEM structure
  // Note: This is simplified - for production use jwk-to-pem library
  return `-----BEGIN PUBLIC KEY-----\n${Buffer.concat([modulus, exponent]).toString('base64')}\n-----END PUBLIC KEY-----`;
}

/**
 * Handle Apple Server-to-Server notifications
 * POST /api/apple/notifications
 */
export async function POST({ request }) {
  const startTime = Date.now();
  
  try {
    console.log('🍎 Received Apple notification');
    
    // Read the raw body as text (Apple sends JWS token)
    const rawBody = await request.text();
    
    if (!rawBody) {
      console.error('❌ Empty notification body');
      return new Response('Bad Request', { status: 400 });
    }
    
    // Decode the JWT header to get the key ID
    let decodedHeader;
    try {
      decodedHeader = jwt.decode(rawBody, { complete: true })?.header;
    } catch (error) {
      console.error('❌ Failed to decode JWT header:', error);
      return new Response('Invalid JWT', { status: 400 });
    }
    
    if (!decodedHeader || !decodedHeader.kid) {
      console.error('❌ Missing key ID in JWT header');
      return new Response('Invalid JWT header', { status: 400 });
    }
    
    // Get Apple's public keys
    const keys = await getAppleKeys();
    const publicKey = keys.find(key => key.kid === decodedHeader.kid);
    
    if (!publicKey) {
      console.error('❌ Public key not found for kid:', decodedHeader.kid);
      return new Response('Invalid key ID', { status: 400 });
    }
    
    // Convert JWK to PEM format
    const pemKey = jwkToPem(publicKey);
    
    // Verify the JWT signature and extract payload
    let payload;
    try {
      payload = jwt.verify(rawBody, pemKey, { 
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com'
      });
    } catch (error) {
      console.error('❌ JWT verification failed:', error);
      return new Response('Invalid signature', { status: 400 });
    }
    
    console.log('✅ Apple notification verified:', {
      type: payload.notificationType,
      sub: payload.sub,
      aud: payload.aud,
      iat: payload.iat
    });
    
    // Handle different notification types
    await handleAppleNotification(payload);
    
    // Always respond with 200 within 10 seconds
    const processingTime = Date.now() - startTime;
    console.log(`✅ Apple notification processed in ${processingTime}ms`);
    
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Apple notification processing failed:', error);
    
    // Still return 200 to avoid Apple retrying
    // Log the error for investigation
    return new Response('Internal Error', { status: 200 });
  }
}

/**
 * Process different types of Apple notifications
 */
async function handleAppleNotification(payload) {
  const { notificationType, sub, aud } = payload;
  
  console.log(`🔔 Processing Apple notification: ${notificationType} for user: ${sub}`);
  
  switch (notificationType) {
    case 'email-disabled':
      console.log('📧 User disabled email relay');
      // Handle email relay disabled
      await handleEmailDisabled(sub);
      break;
      
    case 'email-enabled':
      console.log('📧 User enabled email relay');
      // Handle email relay enabled
      await handleEmailEnabled(sub);
      break;
      
    case 'consent-revoked':
      console.log('🚫 User revoked consent');
      // Handle consent revocation - user signed out of Apple ID
      await handleConsentRevoked(sub);
      break;
      
    case 'account-delete':
      console.log('🗑️ User deleted Apple ID account');
      // Handle account deletion
      await handleAccountDelete(sub);
      break;
      
    default:
      console.log(`⚠️ Unknown notification type: ${notificationType}`);
  }
}

/**
 * Handle email relay disabled notification
 */
async function handleEmailDisabled(appleUserId) {
  try {
    // TODO: Update user record to indicate email relay is disabled
    // You might want to:
    // 1. Find user by Apple ID (sub)
    // 2. Update their email preferences
    // 3. Send them a notification about the change
    
    console.log(`📧 Email disabled for Apple user: ${appleUserId}`);
  } catch (error) {
    console.error('❌ Failed to handle email disabled:', error);
  }
}

/**
 * Handle email relay enabled notification
 */
async function handleEmailEnabled(appleUserId) {
  try {
    // TODO: Update user record to indicate email relay is enabled
    console.log(`📧 Email enabled for Apple user: ${appleUserId}`);
  } catch (error) {
    console.error('❌ Failed to handle email enabled:', error);
  }
}

/**
 * Handle consent revoked notification
 */
async function handleConsentRevoked(appleUserId) {
  try {
    // TODO: Handle user consent revocation
    // This means the user signed out of their Apple ID
    // You should:
    // 1. Find the user by Apple ID
    // 2. Invalidate their session
    // 3. Optionally notify them via other channels
    
    console.log(`🚫 Consent revoked for Apple user: ${appleUserId}`);
  } catch (error) {
    console.error('❌ Failed to handle consent revoked:', error);
  }
}

/**
 * Handle account deletion notification
 */
async function handleAccountDelete(appleUserId) {
  try {
    // TODO: Handle Apple ID account deletion
    // This is critical - you must delete or anonymize user data
    // 1. Find user by Apple ID
    // 2. Delete or anonymize their data per privacy requirements
    // 3. Remove their account from your system
    
    console.log(`🗑️ Account deletion for Apple user: ${appleUserId}`);
  } catch (error) {
    console.error('❌ Failed to handle account deletion:', error);
  }
}
