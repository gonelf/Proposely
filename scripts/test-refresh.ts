import PocketBase from "pocketbase";

const url = "https://proposely.picobase.app";

async function run() {
    // Standard PocketBase without X-PicoBase-Key header
    const pb = new PocketBase(url);

    // Create a temp user
    const email = `test_no_key_${Date.now()}@example.com`;
    const password = "password123";

    console.log("Signing up without PicoBase key...");
    try {
        await pb.collection("users").create({
            email,
            password,
            passwordConfirm: password
        });
        await pb.collection("users").authWithPassword(email, password);
        console.log("Sign up & Auth successful!");

        console.log("Token before refresh:", pb.authStore.token ? "EXISTS" : "NULL");

        console.log("Refreshing token...");
        const result = await pb.collection("users").authRefresh();
        console.log("Refresh successful!", result.token ? "NEW_TOKEN_EXISTS" : "NO_NEW_TOKEN");

    } catch (e: any) {
        console.error("Error occurred:", e.message, e.status, e.data);
    }
}

run();
