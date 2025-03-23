import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Webhook handler pentru evenimentele Stripe
 * Folosim acest endpoint doar pentru a confirma că am primit evenimentele,
 * întreaga logică de procesare este gestionată de extensia Firebase pentru Stripe.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
  
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  
  try {
    // Verificăm semnătura pentru a ne asigura că evenimentul vine de la Stripe
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Putem loga evenimentul primit
    console.log(`Stripe event received: ${event.type}`);
    
    // Nu este nevoie să procesăm manual evenimentul, 
    // extensia Firebase pentru Stripe se ocupă de asta automat
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
} 