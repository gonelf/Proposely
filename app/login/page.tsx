"use client";

import { AuthForm, useAuth, useClient } from "@picobase_app/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const client = useClient();
    const router = useRouter();

    useEffect(() => {
        const checkSubscription = async () => {
            if (!loading && user) {
                try {
                    await client.collection("subscriptions").getList(1, 1, {
                        filter: `user="${user.id}" && status="active"`
                    });
                    router.push("/");
                } catch (err) {
                    console.error("Error checking subscription:", err);
                    router.push("/");
                }
            }
        };

        checkSubscription();
    }, [user, loading, router, client]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-900 text-xl">Proposely</span>
                </Link>
            </div>

            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to save and manage your proposals
                    </p>
                </div>

                {!loading && !user && (
                    <>
                        <AuthForm
                            mode="signIn"
                            className="[&_form>div:last-child]:hidden"
                            onSuccess={() => {
                                router.push("/");
                            }}
                        />
                        <div className="mt-4 text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/checkout" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign up
                            </Link>
                        </div>
                    </>
                )}

                {loading && (
                    <div className="flex justify-center py-8">
                        <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
