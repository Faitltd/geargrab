import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/security/middleware';
import { 
  calculateRentalTax, 
  validateUSAddress, 
  getTaxCodeForItem,
  type TaxCalculationRequest 
} from '$lib/services/tax-calculation';

export async function POST({ request }) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      amount, 
      currency = 'usd', 
      customerAddress, 
      lineItems,
      bookingId 
    } = body;

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!customerAddress) {
      return json({ error: 'Customer address is required for tax calculation' }, { status: 400 });
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return json({ error: 'Line items are required for tax calculation' }, { status: 400 });
    }

    // Validate US address
    const addressValidation = validateUSAddress(customerAddress);
    if (!addressValidation.valid) {
      return json({ 
        error: 'Invalid address', 
        details: addressValidation.errors 
      }, { status: 400 });
    }

    // Prepare line items with proper tax codes
    const processedLineItems = lineItems.map((item: any) => ({
      amount: Math.round(item.amount * 100), // Convert to cents
      reference: item.reference || 'rental_item',
      description: item.description || 'Rental item',
      taxCode: item.taxCode || getTaxCodeForItem(item.category || 'default')
    }));

    // Calculate tax
    const taxCalculation: TaxCalculationRequest = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customerAddress,
      lineItems: processedLineItems
    };

    const taxResult = await calculateRentalTax(taxCalculation);

    // Log tax calculation for audit purposes
    console.log(`💰 Tax calculated for user ${auth.userId}:`, {
      bookingId,
      subtotal: amount,
      taxAmount: taxResult.totalTax / 100,
      totalAmount: (Math.round(amount * 100) + taxResult.totalTax) / 100,
      jurisdiction: taxResult.taxBreakdown[0]?.jurisdiction
    });

    return json({
      success: true,
      taxCalculation: {
        subtotal: Math.round(amount * 100), // Amount in cents
        taxAmount: taxResult.totalTax, // Tax in cents
        total: Math.round(amount * 100) + taxResult.totalTax, // Total in cents
        taxBreakdown: taxResult.taxBreakdown,
        lineItemTaxes: taxResult.lineItemTaxes,
        taxCalculationId: taxResult.taxCalculationId
      }
    });

  } catch (error) {
    console.error('Error calculating tax:', error);
    return json({ 
      error: 'Failed to calculate tax',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ url }) {
  // Get tax rates for an address (for preview purposes)
  try {
    const line1 = url.searchParams.get('line1');
    const city = url.searchParams.get('city');
    const state = url.searchParams.get('state');
    const postal_code = url.searchParams.get('postal_code');
    const country = url.searchParams.get('country') || 'US';

    if (!line1 || !city || !state || !postal_code) {
      return json({ 
        error: 'Address parameters required: line1, city, state, postal_code' 
      }, { status: 400 });
    }

    const address = { line1, city, state, postal_code, country };
    
    // Validate address
    const addressValidation = validateUSAddress(address);
    if (!addressValidation.valid) {
      return json({ 
        error: 'Invalid address', 
        details: addressValidation.errors 
      }, { status: 400 });
    }

    // Get tax rates (this is a simplified version for preview)
    const { getTaxRatesForAddress } = await import('$lib/services/tax-calculation');
    const taxRates = await getTaxRatesForAddress(address);

    return json({
      success: true,
      taxRates: {
        estimatedRate: taxRates.estimatedRate,
        jurisdiction: taxRates.jurisdiction,
        applicableTaxes: taxRates.applicableTaxes,
        formattedRate: `${(taxRates.estimatedRate * 100).toFixed(2)}%`
      }
    });

  } catch (error) {
    console.error('Error getting tax rates:', error);
    return json({ 
      error: 'Failed to get tax rates',
      details: error.message 
    }, { status: 500 });
  }
}
