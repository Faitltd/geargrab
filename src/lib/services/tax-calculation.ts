import { getStripe } from '$lib/stripe/server';

export interface TaxCalculationRequest {
  amount: number; // Amount in cents
  currency: string;
  customerAddress: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  lineItems: Array<{
    amount: number; // Amount in cents
    reference: string; // e.g., 'rental_fee', 'service_fee', 'delivery_fee'
    description: string;
    taxCode?: string; // Stripe tax code
  }>;
}

export interface TaxCalculationResult {
  totalTax: number; // Total tax in cents
  taxBreakdown: Array<{
    amount: number;
    rate: number;
    jurisdiction: string;
    type: string; // 'state', 'county', 'city', etc.
  }>;
  lineItemTaxes: Array<{
    reference: string;
    taxAmount: number;
    taxRate: number;
  }>;
  taxCalculationId: string; // Stripe tax calculation ID
}

export interface PaymentIntentWithTax {
  paymentIntentId: string;
  clientSecret: string;
  subtotal: number; // Amount before tax in cents
  taxAmount: number; // Tax amount in cents
  total: number; // Total amount including tax in cents
  taxBreakdown: TaxCalculationResult['taxBreakdown'];
}

/**
 * Calculate tax for a rental booking using Stripe Tax
 */
export async function calculateRentalTax(
  request: TaxCalculationRequest
): Promise<TaxCalculationResult> {
  try {
    const stripe = await getStripe();

    // Create tax calculation with Stripe
    const taxCalculation = await stripe.tax.calculations.create({
      currency: request.currency,
      customer_details: {
        address: request.customerAddress,
        address_source: 'provided'
      },
      line_items: request.lineItems.map(item => ({
        amount: item.amount,
        reference: item.reference,
        tax_code: item.taxCode || 'txcd_99999999', // General tangible goods
        tax_behavior: 'exclusive' // Tax is added on top of the amount
      }))
    });

    // Process tax breakdown
    const taxBreakdown = taxCalculation.tax_breakdown?.map(breakdown => ({
      amount: breakdown.amount,
      rate: breakdown.rate,
      jurisdiction: breakdown.jurisdiction?.display_name || 'Unknown',
      type: breakdown.jurisdiction?.type || 'unknown'
    })) || [];

    // Process line item taxes
    const lineItemTaxes = request.lineItems.map(item => {
      const lineItemTax = taxCalculation.line_items?.find(li => li.reference === item.reference);
      return {
        reference: item.reference,
        taxAmount: lineItemTax?.amount_tax || 0,
        taxRate: lineItemTax?.tax_breakdown?.[0]?.rate || 0
      };
    });

    return {
      totalTax: taxCalculation.amount_total - taxCalculation.amount_subtotal,
      taxBreakdown,
      lineItemTaxes,
      taxCalculationId: taxCalculation.id
    };

  } catch (error) {
    console.error('Error calculating tax:', error);
    throw new Error('Failed to calculate tax. Please try again.');
  }
}

/**
 * Create payment intent with automatic tax calculation
 */
export async function createPaymentIntentWithTax(
  amount: number, // Subtotal in cents (before tax)
  currency: string,
  customerAddress: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  },
  lineItems: TaxCalculationRequest['lineItems'],
  metadata: Record<string, string> = {}
): Promise<PaymentIntentWithTax> {
  try {
    const stripe = await getStripe();

    // First calculate tax
    const taxResult = await calculateRentalTax({
      amount,
      currency,
      customerAddress,
      lineItems
    });

    const totalAmount = amount + taxResult.totalTax;

    // Create payment intent with automatic tax
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        ...metadata,
        subtotal: amount.toString(),
        tax_amount: taxResult.totalTax.toString(),
        tax_calculation_id: taxResult.taxCalculationId
      }
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      subtotal: amount,
      taxAmount: taxResult.totalTax,
      total: totalAmount,
      taxBreakdown: taxResult.taxBreakdown
    };

  } catch (error) {
    console.error('Error creating payment intent with tax:', error);
    throw new Error('Failed to create payment with tax calculation.');
  }
}

/**
 * Get tax rates for a specific address (for display purposes)
 */
export async function getTaxRatesForAddress(address: {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): Promise<{
  estimatedRate: number;
  jurisdiction: string;
  applicableTaxes: Array<{
    type: string;
    rate: number;
    jurisdiction: string;
  }>;
}> {
  try {
    // Create a small test calculation to get tax rates
    const testCalculation = await calculateRentalTax({
      amount: 1000, // $10.00 test amount
      currency: 'usd',
      customerAddress: address,
      lineItems: [{
        amount: 1000,
        reference: 'test',
        description: 'Test item for tax rate calculation',
        taxCode: 'txcd_99999999'
      }]
    });

    const totalRate = testCalculation.taxBreakdown.reduce((sum, tax) => sum + tax.rate, 0);
    const primaryJurisdiction = testCalculation.taxBreakdown[0]?.jurisdiction || 'Unknown';

    return {
      estimatedRate: totalRate,
      jurisdiction: primaryJurisdiction,
      applicableTaxes: testCalculation.taxBreakdown.map(tax => ({
        type: tax.type,
        rate: tax.rate,
        jurisdiction: tax.jurisdiction
      }))
    };

  } catch (error) {
    console.error('Error getting tax rates:', error);
    // Return default values if tax calculation fails
    return {
      estimatedRate: 0,
      jurisdiction: 'Unknown',
      applicableTaxes: []
    };
  }
}

/**
 * Validate US address for tax calculation
 */
export function validateUSAddress(address: {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address.line1?.trim()) {
    errors.push('Street address is required');
  }

  if (!address.city?.trim()) {
    errors.push('City is required');
  }

  if (!address.state?.trim()) {
    errors.push('State is required');
  } else if (address.state.length !== 2) {
    errors.push('State must be a 2-letter code (e.g., CA, NY)');
  }

  if (!address.postal_code?.trim()) {
    errors.push('ZIP code is required');
  } else if (!/^\d{5}(-\d{4})?$/.test(address.postal_code)) {
    errors.push('ZIP code must be in format 12345 or 12345-6789');
  }

  if (address.country !== 'US') {
    errors.push('Only US addresses are supported for tax calculation');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get tax code for different types of rental items
 */
export function getTaxCodeForItem(category: string): string {
  const taxCodes: Record<string, string> = {
    // Outdoor gear categories
    'camping': 'txcd_99999999', // General tangible goods
    'hiking': 'txcd_99999999',
    'climbing': 'txcd_99999999',
    'skiing': 'txcd_99999999',
    'snowboarding': 'txcd_99999999',
    'cycling': 'txcd_99999999',
    'water-sports': 'txcd_99999999',
    'photography': 'txcd_99999999',
    'electronics': 'txcd_99999999',
    
    // Service fees
    'service_fee': 'txcd_10103001', // Platform/marketplace fees
    'delivery_fee': 'txcd_30070000', // Delivery services
    'guarantee_fee': 'txcd_40060000', // GearGrab Guarantee services
    
    // Default
    'default': 'txcd_99999999'
  };

  return taxCodes[category.toLowerCase()] || taxCodes.default;
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amountInCents / 100);
}

/**
 * Format tax rate for display
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}
