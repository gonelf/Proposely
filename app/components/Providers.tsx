"use client";

import { TacoProvider } from "@tacobase/react";

export function Providers({ children }: { children: React.ReactNode }) {
    const url = process.env.NEXT_PUBLIC_TACOBASE_URL || "https://example.tacobase.dev";
    const apiKey = process.env.NEXT_PUBLIC_TACOBASE_API_KEY || "tbk_example";

    return (
        <TacoProvider url={url} apiKey={apiKey}>
            {children}
        </TacoProvider>
    );
}
