/**
 * GearGrab Guarantee Service
 * Stub implementation for deployment
 */

export const GUARANTEE_TIERS = {
  NONE: 'none',
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium'
};



// Percentage-based guarantee pricing tiers
export const GUARANTEE_PRICING_TIERS = {
  none: {
    name: 'No GearGrab Guarantee',
    percentage: 0,
    description: 'No coverage - rent at your own risk',
    coverage: {
      damageLimit: 0,
      theftLimit: 0,
      deductible: 0
    }
  },
  basic: {
    name: 'Basic GearGrab Guarantee',
    percentage: 0.08, // 8% of gear value
    description: 'Basic coverage for damage and theft',
    coverage: {
      damageLimit: 500,
      theftLimit: 300,
      deductible: 100
    }
  },
  standard: {
    name: 'Standard GearGrab Guarantee',
    percentage: 0.12, // 12% of gear value
    description: 'Enhanced coverage with lower deductible',
    coverage: {
      damageLimit: 1000,
      theftLimit: 750,
      deductible: 50
    }
  },
  premium: {
    name: 'Premium GearGrab Guarantee',
    percentage: 0.18, // 18% of gear value
    description: 'Comprehensive coverage with minimal deductible',
    coverage: {
      damageLimit: 2000,
      theftLimit: 1500,
      deductible: 25
    }
  }
};



export const guaranteeService = {
  getClaims: async () => {
    return [
      {
        id: 'claim-1',
        bookingId: 'booking-123',
        type: 'damage',
        status: 'pending',
        amount: 250.00,
        description: 'Tent zipper damaged during rental',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16')
      }
    ];
  },

  submitClaim: async (claimData) => {
    return {
      id: 'claim-' + Date.now(),
      ...claimData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

/**
 * Get GearGrab Guarantee claims
 * @returns {Promise<Array>} GearGrab Guarantee claims
 */
export async function getGuaranteeClaims() {
  console.log('Getting GearGrab Guarantee claims');
  
  // Stub implementation
  return [
    {
      id: 'claim-1',
      bookingId: 'booking-123',
      type: 'damage',
      status: 'pending',
      amount: 250.00,
      description: 'Tent zipper damaged during rental',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-16')
    },
    {
      id: 'claim-2',
      bookingId: 'booking-456',
      type: 'theft',
      status: 'approved',
      amount: 450.00,
      description: 'Sleeping bag stolen from campsite',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12')
    }
  ];
}

/**
 * Submit GearGrab Guarantee claim
 * @param {Object} claimData - Claim data
 * @returns {Promise<Object>} Submitted claim
 */
export async function submitGuaranteeClaim(claimData) {
  console.log('Submitting GearGrab Guarantee claim:', claimData);
  
  // Stub implementation
  return {
    id: 'claim-' + Date.now(),
    ...claimData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Get GearGrab Guarantee tiers
 * @returns {Promise<Array>} GearGrab Guarantee tiers
 */
export async function getGuaranteeTiers() {
  console.log('Getting GearGrab Guarantee tiers');
  
  // Stub implementation
  return [
    {
      id: 'policy-basic',
      name: 'Basic Protection',
      coverage: 500,
      deductible: 50,
      premium: 15,
      description: 'Basic coverage for damage and theft'
    },
    {
      id: 'policy-premium',
      name: 'Premium Protection',
      coverage: 1500,
      deductible: 25,
      premium: 35,
      description: 'Comprehensive coverage with lower deductible'
    }
  ];
}

/**
 * Calculate GearGrab Guarantee cost based on gear value and tier
 * @param {number} gearValue - Value of the gear being rented
 * @param {string} tier - GearGrab Guarantee tier (none, basic, standard, premium)
 * @param {number} rentalDays - Number of rental days
 * @returns {Object} GearGrab Guarantee calculation
 */
export function calculateGuaranteeCost(gearValue, tier = 'none', rentalDays = 1) {
  const tierConfig = GUARANTEE_PRICING_TIERS[tier];

  if (!tierConfig) {
    throw new Error(`Invalid GearGrab Guarantee tier: ${tier}`);
  }

  // Calculate base GearGrab Guarantee cost as percentage of gear value
  const baseCost = gearValue * tierConfig.percentage;

  // Apply duration multiplier (minimum 1 day)
  const durationMultiplier = Math.max(1, rentalDays / 7); // Weekly basis
  const totalCost = Math.round(baseCost * durationMultiplier * 100) / 100;

  return {
    tier,
    tierName: tierConfig.name,
    cost: totalCost,
    baseCost,
    gearValue,
    rentalDays,
    percentage: tierConfig.percentage * 100, // Convert to percentage for display
    coverage: tierConfig.coverage,
    description: tierConfig.description
  };
}

/**
 * Get all available GearGrab Guarantee tiers with costs for a specific gear value
 * @param {number} gearValue - Value of the gear being rented
 * @param {number} rentalDays - Number of rental days
 * @returns {Array} Array of GearGrab Guarantee options with costs
 */
export function getGuaranteeOptions(gearValue, rentalDays = 1) {
  return Object.keys(GUARANTEE_PRICING_TIERS).map(tier =>
    calculateGuaranteeCost(gearValue, tier, rentalDays)
  );
}

/**
 * Calculate GearGrab Guarantee premium (legacy function for compatibility)
 * @param {Object} params - Calculation parameters
 * @returns {Promise<Object>} Premium calculation
 */
export async function calculateGuaranteePremium(params) {
  console.log('Calculating GearGrab Guarantee premium:', params);

  const { itemValue, duration = 7, tier = 'standard' } = params;

  const result = calculateGuaranteeCost(itemValue, tier, duration);

  return {
    premium: result.cost,
    coverage: Math.min(itemValue, result.coverage.damageLimit),
    deductible: result.coverage.deductible,
    tier: result.tier
  };
}
