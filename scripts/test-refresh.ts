import { createClient } from "@tacobase/client";

const url = "https://proposely.tacobase.dev";

async function run() {
    const db = createClient(url, "tbk_example");

    const email = `test_${Date.now()}@example.com`;
    const password = "password123";

    console.log("Signing up...");
    try {
        await db.auth.signUp({ email, password, passwordConfirm: password });
        console.log("Sign up successful!");

        console.log("Token before refresh:", db.token ? "EXISTS" : "NULL");

        console.log("Refreshing token...");
        const result = await db.auth.refreshToken();
        console.log("Refresh successful!", result.token ? "NEW_TOKEN_EXISTS" : "NO_NEW_TOKEN");

    } catch (e: any) {
        console.error("Error occurred:", e.message);
    }
}

run();
