import { createClient } from "@picobase_app/client";

const url = process.env.NEXT_PUBLIC_PICOBASE_URL || "https://example.picobase.app";
const apiKey = process.env.NEXT_PUBLIC_PICOBASE_API_KEY || "pbk_example";

export const pb = createClient(url, apiKey);
export default pb;
