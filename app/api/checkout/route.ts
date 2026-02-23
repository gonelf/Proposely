import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
    try {
        const { userId, userEmail } = await req.json();

        if (!userEmail && userId) {
            // Optional: Handle if you only wanted to enforce emails, but Stripe embedded checkout can just ask for it
        }
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
            console.warn("Missing Stripe env vars");
            return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-01-27.acacia" as any, // Using the latest or compatible version supported by installed stripe version
        });

        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            ui_mode: "embedded",
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            return_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        };

        if (userEmail) {
            sessionConfig.customer_email = userEmail;
        }
        if (userId) {
            sessionConfig.client_reference_id = userId;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (error: any) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
