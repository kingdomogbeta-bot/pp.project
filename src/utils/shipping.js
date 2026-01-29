// Mock shipping rates utility
// For production integrate with EasyPost, Shippo, UPS/FedEx APIs server-side.

const carriers = [
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'usps', name: 'USPS' },
  { id: 'dhl', name: 'DHL' }
]

const serviceMap = [
  { id: 'overnight', name: 'Overnight', multiplier: 3.2 },
  { id: 'express', name: '2-Day', multiplier: 2.0 },
  { id: 'ground', name: 'Ground', multiplier: 1.0 }
]

// Simulate async fetch of rates. In real integration, call your backend which will
// call carriers/EasyPost and return rates. Pass address, items, and optional apiKey.
export async function getShippingRates({ address = {}, items = [], apiKey = null }) {
  // quick validation
  await sleep(400) // simulate network

  if (!address || !address.zip) {
    return { error: 'Enter ZIP / postal code to get rates', rates: [] }
  }

  // approximate "weight" by number of items and their qty
  const totalQty = (items || []).reduce((s, it) => s + (it.qty || 1), 0)
  const subtotal = (items || []).reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0)

  // base price influenced by subtotal and qty
  const base = Math.max(5, Math.min(25, subtotal * 0.02 + totalQty * 0.5))

  const rates = []
  carriers.forEach(car => {
    serviceMap.forEach(service => {
      const price = +(base * service.multiplier * (1 + Math.abs(hashZip(address.zip + car.id)) % 10 / 100)).toFixed(2)
      rates.push({
        id: `${car.id}_${service.id}`,
        carrier: car.id,
        carrierName: car.name,
        service: service.id,
        serviceName: service.name,
        eta: estimateETA(service.id),
        price
      })
    })
  })

  // sort by price
  rates.sort((a, b) => a.price - b.price)
  return { rates }
}

function estimateETA(service) {
  if (service === 'overnight') return '1 business day'
  if (service === 'express') return '2 business days'
  return '3-7 business days'
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function hashZip(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export function getAvailableCarriers() {
  return carriers
}
