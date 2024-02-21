import { NextRequest, NextResponse } from 'next/server';
import { ValidationError } from '@/types/ValidationError';
import { getUserFromSession } from '@/utils/userSessionUtils';
import Stripe from 'stripe';

/**
 * POST request to create a new Stripe payment session
 * @param amount {number} The amount of the payment
 * @param redirectUrl {string} The URL to redirect to after the payment is complete
 */
const NewPayment = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body and validate
    const body = await req.json();
    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    // Get the data from the request body
    const { amount, redirectUrl } = body;

    try {
        // Check if the user is authenticated
        const user = await getUserFromSession();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Check if the amount is valid (is an integer and less than or equal to 1000)
        if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        // Check if redirect URL is valid
        if (!redirectUrl) {
            return NextResponse.json({ message: 'Invalid redirect URL' }, { status: 400 });
        }

        // Create a new payment session
        const session = await createCheckoutSession(amount, redirectUrl);

        // Return the session id to the client
        return NextResponse.json({ message: 'Payment created', sessionId: session.id }, { status: 200 });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ message: error.message }, { status: error.statusCode });
        } else {
            console.error('Error creating payment:', error);
            return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
        }
    }
};

/**
 * Function to create a new Stripe checkout session
 * @param amount
 * @param redirectUrl
 * @returns
 */
const createCheckoutSession = async (amount: number, redirectUrl: string) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    // Convert the amount for the stripe API
    const amountInCents = amount * 100;

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                // Use dynamic pricing by specifying the amount directly
                // Another approach is to use a product and price ID
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: `Donation Amount £${amount}`,
                    },
                    unit_amount: amountInCents,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${redirectUrl}/donation/result?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${redirectUrl}/cdonation/result?payment_success=false&canceled=true&session_id={CHECKOUT_SESSION_ID}`,
    });

    return session;
};

export { NewPayment as POST };
