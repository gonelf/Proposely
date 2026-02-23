import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@picobase_app/client";

export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: "Missing Stripe secret key" }, { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-01-27.acacia" as any,
    });
    const pbUrl = process.env.NEXT_PUBLIC_PICOBASE_URL;
    const adminKey = process.env.PICOBASE_ADMIN_API_KEY;
    if (!pbUrl || !adminKey) {
        return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
    }
    const pb = createClient(pbUrl, adminKey);
    try {
        const body = await req.text();
        const signature = req.headers.get("stripe-signature") as string;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            const userId = session.client_reference_id;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            if (userId && customerId && subscriptionId) {
                try {
                    // Check if subscription exists for the user
                    const existing = await pb.collection("subscriptions").getList(1, 1, {
                        filter: `user="${userId}"`
                    });

                    if (existing.items && existing.items.length > 0) {
                        // Update
                        await pb.collection("subscriptions").update(existing.items[0].id, {
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            status: "active"
                        });
                    } else {
                        // Create
                        await pb.collection("subscriptions").create({
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            status: "active",
                            user: userId
                        });
                    }
                    console.log(`Successfully activated subscription for user ${userId}`);
                } catch (pbErr) {
                    console.error("Failed to update Picobase:", pbErr);
                }
            }
        } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as Stripe.Subscription;
            const status = subscription.status;
            try {
                const existing = await pb.collection("subscriptions").getList(1, 1, {
                    filter: `stripeSubscriptionId="${subscription.id}"`
                });
                if (existing.items && existing.items.length > 0) {
                    await pb.collection("subscriptions").update(existing.items[0].id, {
                        status: status === "active" ? "active" : "inactive"
                    });
                }
            } catch (err) {
                console.error("Error updating subscription status:", err);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook unexpected error", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}
