import { createClient } from "@tacobase/client";

const url = process.env.NEXT_PUBLIC_TACOBASE_URL || "https://example.tacobase.dev";
const apiKey = process.env.NEXT_PUBLIC_TACOBASE_API_KEY || "tbk_example";

export const pb = createClient(url, apiKey);
export default pb;
