import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

// Test endpoint to simulate Stripe webhooks for development
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const { eventType, paymentIntentId, metadata = {} } = await request.json();

    if (!eventType || !paymentIntentId) {
      return json({ 
        error: 'eventType and paymentIntentId are required' 
      }, { status: 400 });
    }

    // Create mock Stripe webhook payload
    const mockEvent = createMockStripeEvent(eventType, paymentIntentId, metadata);
    
    // Create mock signature
    const mockSignature = createMockSignature(JSON.stringify(mockEvent));

    // Send webhook to our webhook handler
    const webhookUrl = `${url.origin}/api/webhooks/stripe`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': mockSignature
      },
      body: JSON.stringify(mockEvent)
    });

    if (!response.ok) {
      const error = await response.text();
      return json({ 
        error: `Webhook failed: ${error}` 
      }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: `Mock ${eventType} webhook sent successfully`,
      eventId: mockEvent.id,
      paymentIntentId
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return json({ 
      error: 'Failed to send test webhook' 
    }, { status: 500 });
  }
};

// Create mock Stripe event
function createMockStripeEvent(eventType: string, paymentIntentId: string, metadata: any) {
  const baseEvent = {
    id: `evt_${Math.random().toString(36).substring(2, 15)}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Math.random().toString(36).substring(2, 15)}`,
      idempotency_key: null
    }
  };

  switch (eventType) {
    case 'payment_intent.succeeded':
      return {
        ...baseEvent,
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: metadata.amount || 5000, // $50.00 default
            amount_capturable: 0,
            amount_details: {
              tip: {}
            },
            amount_received: metadata.amount || 5000,
            application: null,
            application_fee_amount: null,
            automatic_payment_methods: {
              enabled: true
            },
            canceled_at: null,
            cancellation_reason: null,
            capture_method: 'automatic',
            charges: {
              object: 'list',
              data: [
                {
                  id: `ch_${Math.random().toString(36).substring(2, 15)}`,
                  object: 'charge',
                  amount: metadata.amount || 5000,
                  amount_captured: metadata.amount || 5000,
                  amount_refunded: 0,
                  application: null,
                  application_fee: null,
                  application_fee_amount: null,
                  balance_transaction: `txn_${Math.random().toString(36).substring(2, 15)}`,
                  billing_details: {
                    address: {
                      city: null,
                      country: null,
                      line1: null,
                      line2: null,
                      postal_code: null,
                      state: null
                    },
                    email: null,
                    name: null,
                    phone: null
                  },
                  calculated_statement_descriptor: 'GEARGRAB',
                  captured: true,
                  created: Math.floor(Date.now() / 1000),
                  currency: 'usd',
                  customer: null,
                  description: null,
                  disputed: false,
                  failure_code: null,
                  failure_message: null,
                  fraud_details: {},
                  invoice: null,
                  livemode: false,
                  metadata: metadata,
                  outcome: {
                    network_status: 'approved_by_network',
                    reason: null,
                    risk_level: 'normal',
                    risk_score: 32,
                    seller_message: 'Payment complete.',
                    type: 'authorized'
                  },
                  paid: true,
                  payment_intent: paymentIntentId,
                  payment_method: `pm_${Math.random().toString(36).substring(2, 15)}`,
                  payment_method_details: {
                    card: {
                      brand: 'visa',
                      checks: {
                        address_line1_check: null,
                        address_postal_code_check: null,
                        cvc_check: 'pass'
                      },
                      country: 'US',
                      exp_month: 12,
                      exp_year: 2025,
                      fingerprint: 'fingerprint123',
                      funding: 'credit',
                      installments: null,
                      last4: '4242',
                      mandate: null,
                      network: 'visa',
                      three_d_secure: null,
                      wallet: null
                    },
                    type: 'card'
                  },
                  receipt_email: null,
                  receipt_number: null,
                  receipt_url: `https://pay.stripe.com/receipts/test_receipt`,
                  refunded: false,
                  refunds: {
                    object: 'list',
                    data: [],
                    has_more: false,
                    total_count: 0,
                    url: '/v1/charges/ch_test/refunds'
                  },
                  review: null,
                  shipping: null,
                  source_transfer: null,
                  statement_descriptor: null,
                  statement_descriptor_suffix: null,
                  status: 'succeeded',
                  transfer_data: null,
                  transfer_group: null
                }
              ],
              has_more: false,
              total_count: 1,
              url: `/v1/charges?payment_intent=${paymentIntentId}`
            },
            client_secret: `${paymentIntentId}_secret_test`,
            confirmation_method: 'automatic',
            created: Math.floor(Date.now() / 1000),
            currency: 'usd',
            customer: null,
            description: null,
            invoice: null,
            last_payment_error: null,
            latest_charge: `ch_${Math.random().toString(36).substring(2, 15)}`,
            livemode: false,
            metadata: metadata,
            next_action: null,
            on_behalf_of: null,
            payment_method: `pm_${Math.random().toString(36).substring(2, 15)}`,
            payment_method_options: {
              card: {
                installments: null,
                mandate_options: null,
                network: null,
                request_three_d_secure: 'automatic'
              }
            },
            payment_method_types: ['card'],
            processing: null,
            receipt_email: null,
            review: null,
            setup_future_usage: null,
            shipping: null,
            source: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'succeeded',
            transfer_data: null,
            transfer_group: null
          }
        }
      };

    case 'payment_intent.payment_failed':
      return {
        ...baseEvent,
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: metadata.amount || 5000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              charge: `ch_${Math.random().toString(36).substring(2, 15)}`,
              code: 'card_declined',
              decline_code: 'generic_decline',
              doc_url: 'https://stripe.com/docs/error-codes/card-declined',
              message: 'Your card was declined.',
              payment_method: {
                id: `pm_${Math.random().toString(36).substring(2, 15)}`,
                object: 'payment_method',
                type: 'card'
              },
              type: 'card_error'
            },
            metadata: metadata,
            created: Math.floor(Date.now() / 1000)
          }
        }
      };

    case 'payment_intent.canceled':
      return {
        ...baseEvent,
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: metadata.amount || 5000,
            currency: 'usd',
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
            cancellation_reason: 'requested_by_customer',
            metadata: metadata,
            created: Math.floor(Date.now() / 1000)
          }
        }
      };

    default:
      return {
        ...baseEvent,
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            metadata: metadata
          }
        }
      };
  }
}

// Create mock signature for testing
function createMockSignature(payload: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  
  // Remove the whsec_ prefix if present
  const cleanSecret = secret.replace('whsec_', '');
  
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', cleanSecret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}
