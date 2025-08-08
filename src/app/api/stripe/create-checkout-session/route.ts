import { NextRequest, NextResponse } from 'next/server'

// Placeholder: integrate official Stripe SDK and secret key in env
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, currency, tourTitle, successUrl, cancelUrl } = await req.json()

    if (!bookingId || !amount || !currency || !tourTitle || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Create a real Stripe Checkout session here
    // const session = await stripe.checkout.sessions.create({ ... })
    // return NextResponse.json({ url: session.url })

    // Scaffold response: redirect back (no-op) until Stripe is configured
    return NextResponse.json({ url: successUrl })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}


