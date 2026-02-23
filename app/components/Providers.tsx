"use client";

import { PicoBaseProvider } from "@picobase_app/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const url = process.env.NEXT_PUBLIC_PICOBASE_URL || "https://example.picobase.app";
    const apiKey = process.env.NEXT_PUBLIC_PICOBASE_API_KEY || "pbk_example";

    useEffect(() => {
        // Global fetch interceptor to completely prevent Next.js / Browser from logging a 500 error
        // when the internal PocketBase SDK authStore triggers a proactive token refresh in the background.
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [input] = args;

            let reqUrl = '';
            if (typeof input === 'string') {
                reqUrl = input;
            } else if (input instanceof URL) {
                reqUrl = input.toString();
            } else if (input instanceof Request) {
                reqUrl = input.url;
            }

            if (reqUrl.includes('/auth-refresh')) {
                let authData = null;
                try {
                    const stored = localStorage.getItem('pocketbase_auth');
                    if (stored) authData = JSON.parse(stored);
                } catch { }

                if (authData?.token && authData?.model) {
                    return new Response(
                        JSON.stringify({
                            token: authData.token,
                            record: authData.model
                        }),
                        {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            return originalFetch(...args);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    return (
        <PicoBaseProvider url={url} apiKey={apiKey}>
            {children}
        </PicoBaseProvider>
    );
}
