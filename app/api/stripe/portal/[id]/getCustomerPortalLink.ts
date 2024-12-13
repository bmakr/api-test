import Stripe from 'stripe'

// PRELAUNCH TODO: CHANGE SECRET KEY TO LIVE

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_RETURN_PATH = process.env.STRIPE_RETURN_PATH as string
const STRIPE_RETURN_HOST = process.env.STRIPE_RETURN_HOST as string
const stripe = new Stripe(STRIPE_SECRET_KEY)

export async function getCustomerPortalLink({ 
  customerId 
}: { 
  customerId: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: STRIPE_RETURN_HOST + STRIPE_RETURN_PATH,
  });
  
  return session.url;
} 
