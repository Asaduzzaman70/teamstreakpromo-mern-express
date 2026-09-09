import Stripe from 'stripe';
import config from '../../config/config.js';

// Initialize stripe instance
const stripe = new Stripe(config.stripeSecretKey);

const createCheckoutSession = async (
  amount: number,
  currency: string = 'usd',
  successUrl: string,
  cancelUrl: string
) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'TeamStreak Promo Service',
          },
          unit_amount: Math.round(amount * 100), // Stripe expects amount in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl || `${config.serverUrl}/payment-success`,
    cancel_url: cancelUrl || `${config.serverUrl}/payment-cancel`,
  });

  return session;
};

export const PaymentService = {
  createCheckoutSession,
};
