import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Payment configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  payment_method_types: ['card'],
  mode: 'payment' as const,
}

// Product pricing configuration
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: 'price_starter', // Will be updated with actual Stripe price IDs
    features: [
      'Up to 5 tours per month',
      'Basic analytics',
      'Email support',
      'Standard community features'
    ]
  },
  professional: {
    name: 'Professional', 
    price: 79,
    priceId: 'price_professional',
    features: [
      'Unlimited tours',
      'Advanced analytics',
      'Priority support',
      'AI assistant',
      'Custom branding'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: 'price_enterprise', 
    features: [
      'Everything in Professional',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'API access'
    ]
  }
}

// Commission rates for marketplace transactions
export const COMMISSION_RATES = {
  standard: 0.08, // 8%
  premium: 0.10,  // 10%
  enterprise: 0.12 // 12%
}