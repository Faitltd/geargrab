#!/usr/bin/env node

/**
 * Script to fix undefined field assignments in listing creation
 */

import fs from 'fs';

function fixListingUndefinedFields() {
  console.log('🔧 Fixing undefined field assignments in list-gear page...');
  
  const filePath = 'src/routes/list-gear/+page.svelte';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the deliveryOptions object to not use undefined
    const oldDeliveryOptions = `        deliveryOptions: {
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          shipping: formData.shipping,
          pickupLocation: formData.pickup ? formData.pickupLocation : undefined,
          dropoffDistance: formData.dropoff ? formData.dropoffDistance : undefined,
          shippingFee: formData.shipping ? formData.shippingFee : undefined
        },`;
    
    const newDeliveryOptions = `        deliveryOptions: {
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          shipping: formData.shipping,
          pickupLocation: formData.pickup ? formData.pickupLocation : '',
          dropoffDistance: formData.dropoff ? formData.dropoffDistance : 0,
          shippingFee: formData.shipping ? formData.shippingFee : 0
        },`;
    
    if (content.includes(oldDeliveryOptions)) {
      content = content.replace(oldDeliveryOptions, newDeliveryOptions);
      console.log('✅ Fixed deliveryOptions undefined values');
    }
    
    // Fix other undefined assignments
    const undefinedReplacements = [
      {
        old: 'subcategory: formData.subcategory || undefined,',
        new: 'subcategory: formData.subcategory || \'\','
      },
      {
        old: 'brand: formData.brand || undefined,',
        new: 'brand: formData.brand || \'\','
      },
      {
        old: 'model: formData.model || undefined,',
        new: 'model: formData.model || \'\','
      },
      {
        old: 'ageInYears: formData.ageInYears || undefined,',
        new: 'ageInYears: formData.ageInYears || 0,'
      },
      {
        old: 'weeklyPrice: formData.weeklyPrice || undefined,',
        new: 'weeklyPrice: formData.weeklyPrice || 0,'
      },
      {
        old: 'monthlyPrice: formData.monthlyPrice || undefined,',
        new: 'monthlyPrice: formData.monthlyPrice || 0,'
      },
      {
        old: 'insuranceDetails: formData.includesInsurance ? formData.insuranceDetails : undefined,',
        new: 'insuranceDetails: formData.includesInsurance ? formData.insuranceDetails : \'\','
      },
      {
        old: 'averageRating: undefined,',
        new: 'averageRating: 0,'
      },
      {
        old: 'reviewCount: undefined',
        new: 'reviewCount: 0'
      }
    ];
    
    let changesCount = 0;
    for (const replacement of undefinedReplacements) {
      if (content.includes(replacement.old)) {
        content = content.replace(replacement.old, replacement.new);
        changesCount++;
        console.log(`✅ Fixed: ${replacement.old.split(':')[0]}`);
      }
    }
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content);
    
    console.log(`\n✅ Fixed ${changesCount + 1} undefined field issues`);
    console.log('💾 Updated src/routes/list-gear/+page.svelte');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing undefined fields:', error.message);
    return false;
  }
}

// Run the fix
const success = fixListingUndefinedFields();

if (success) {
  console.log('\n🎉 Undefined field issues fixed!');
  console.log('📝 Next: Run node scripts/fix-image-urls.js to fix image issues');
} else {
  console.log('\n❌ Failed to fix undefined field issues');
  process.exit(1);
}
