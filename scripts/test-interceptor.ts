import { createClient } from "@picobase_app/client";

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    console.log("INTERCEPTOR CALLED WITH:", input.toString());
    return fetch(input, init);
};

const pb = createClient("https://proposely.picobase.app", "pbk_qHJsqJXz_MG2Zb3LCSyfrXf37qqWEeKz36hpMP6l8", {
    fetch: customFetch
});

async function run() {
    try {
        await pb.auth.refreshToken();
    } catch(e: any) {
        console.log("Error:", e.message);
    }
}
run();
