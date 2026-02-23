"use client";

import { useAuth, useClient } from "@picobase_app/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const { user, loading, signOut } = useAuth();
    const client = useClient();
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function checkSub() {
            if (!loading) {
                if (!user) {
                    // Provide a checkout flow for unauthenticated users
                }

                try {
                    let userIdToPass = "";
                    let userEmailToPass = "";

                    if (user) {
                        const res = await client.collection("subscriptions").getList(1, 1, {
                            filter: `user="${user.id}" && status="active"`
                        });

                        if (res.items && res.items.length > 0) {
                            router.push("/");
                            return;
                        }

                        userIdToPass = user.id;
                        userEmailToPass = user.email;
                    }

                    const checkoutRes = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: userIdToPass, userEmail: userEmailToPass })
                    });
                    const data = await checkoutRes.json();
                    if (data.clientSecret) {
                        setClientSecret(data.clientSecret);
                    } else {
                        setError(data.error || "Failed to initialize checkout.");
                    }
                } catch (err) {
                    setError("Failed to initialize checkout.");
                }
            }
        }

        checkSub();
    }, [user, loading, router, client]);

    if (loading || (!clientSecret && !error)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="font-bold text-gray-900 text-lg">Proposely</span>
                        </Link>

                        <button
                            onClick={async () => {
                                await signOut();
                                router.push("/");
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">

                {/* Features (Left) */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
                        Unlock Pro Features
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Elevate your business with unrestricted access to every capability you need. Win more clients, effortlessly.
                    </p>

                    <ul className="space-y-6">
                        {[
                            "Create Unlimited Proposals",
                            "Manage Unlimited Clients and Companies",
                            "Advanced Line Items and Calculations",
                            "High-Quality PDF Downloads"
                        ].map((feature, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{feature}</h3>
                                    <p className="text-gray-500 mt-1">Everything you need, without limits.</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Checkout Form (Right) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg mx-auto md:mx-0 border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 text-center">Subscribe for $5/month</h2>

                    {error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
                            {error}
                        </div>
                    ) : (
                        <div id="checkout">
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
