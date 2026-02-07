import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Helper to find user by customer ID when metadata is missing
  async function findUserByCustomerId(customerId: string) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
    return data?.id;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.userId;

        // Fallback: find user by customer ID
        if (!userId && session.customer) {
          userId = await findUserByCustomerId(session.customer as string);
        }

        console.log('Checkout completed:', { userId, sessionId: session.id, subscription: session.subscription });

        if (userId) {
          const { error } = await supabase
            .from('users')
            .update({
              subscription_tier: 'pro',
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId);
          
          if (error) {
            console.error('Error updating user after checkout:', error);
          } else {
            console.log('User upgraded to pro:', userId);
          }
        } else {
          console.error('No user ID found for checkout session:', session.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.userId;

        // Fallback: find user by customer ID
        if (!userId && subscription.customer) {
          userId = await findUserByCustomerId(subscription.customer as string);
        }

        console.log('Subscription updated:', { userId, status: subscription.status });

        if (userId) {
          const tier = subscription.status === 'active' ? 'pro' : 'free';
          const { error } = await supabase
            .from('users')
            .update({ subscription_tier: tier })
            .eq('id', userId);
          
          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.userId;

        // Fallback: find user by customer ID
        if (!userId && subscription.customer) {
          userId = await findUserByCustomerId(subscription.customer as string);
        }

        console.log('Subscription deleted:', { userId });

        if (userId) {
          const { error } = await supabase
            .from('users')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', userId);
          
          if (error) {
            console.error('Error downgrading user:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        // Could send an email notification here
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
