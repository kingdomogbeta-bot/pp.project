// Promo codes database with validation rules
export const promoCodes = {
  'SAVE10': { discount: 10, type: 'percentage', minAmount: 0, maxUses: 100, description: '10% off on all products' },
  'SAVE20': { discount: 20, type: 'percentage', minAmount: 50, maxUses: 50, description: '20% off on orders over $50' },
  'FLAT15': { discount: 15, type: 'fixed', minAmount: 30, maxUses: 75, description: '$15 off on orders over $30' },
  'WELCOME': { discount: 5, type: 'percentage', minAmount: 0, maxUses: 200, description: '5% welcome discount' },
  'SUMMER30': { discount: 30, type: 'percentage', minAmount: 100, maxUses: 25, description: '30% off on orders over $100' },
  'FREESHIP': { discount: 10, type: 'fixed', minAmount: 75, maxUses: 100, description: 'Free shipping (save $10)' }
}

// Validate promo code
export function validatePromoCode(code, subtotal, appliedCode = null) {
  const trimmedCode = code?.trim().toUpperCase() || ''
  
  if (!trimmedCode) {
    return { valid: false, error: 'Please enter a promo code' }
  }

  if (appliedCode && appliedCode === trimmedCode) {
    return { valid: false, error: 'This code is already applied' }
  }

  if (!promoCodes[trimmedCode]) {
    return { valid: false, error: 'Invalid promo code' }
  }

  const codeData = promoCodes[trimmedCode]

  if (subtotal < codeData.minAmount) {
    return {
      valid: false,
      error: `Minimum order amount of $${codeData.minAmount} required for this code`
    }
  }

  return { valid: true, code: trimmedCode, data: codeData }
}

// Calculate discount amount
export function calculateDiscount(subtotal, codeData) {
  if (!codeData) return 0
  
  if (codeData.type === 'percentage') {
    return (subtotal * codeData.discount) / 100
  } else if (codeData.type === 'fixed') {
    return codeData.discount
  }
  return 0
}

// Get all available promo codes
export function getAvailablePromoCodes() {
  return Object.entries(promoCodes).map(([code, data]) => ({
    code,
    ...data
  }))
}
