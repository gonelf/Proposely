import { createClient } from "@tacobase/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_TACOBASE_URL;
const adminKey = process.env.TACOBASE_ADMIN_API_KEY;

if (!url || !adminKey) {
    console.error("Missing NEXT_PUBLIC_TACOBASE_URL or TACOBASE_ADMIN_API_KEY in .env.local");
    process.exit(1);
}

const pb = createClient(url, adminKey);

async function init() {
    console.log("Initializing Picobase collections...");

    try {
        const collections = await pb.admin.listCollections();
        console.log("Existing collections:", collections.map((c: any) => ({ name: c.name, id: c.id })));
        const existing = collections.map((c: any) => c.name);

        if (!existing.includes("proposals")) {
            console.log("Creating 'proposals' collection...");
            await pb.admin.createCollection({
                name: "proposals",
                type: "flexible",
                schema: [
                    { name: "proposalNumber", type: "text", required: true },
                    { name: "proposalDate", type: "text", required: true },
                    { name: "validUntil", type: "text", required: true },
                    { name: "currency", type: "text", required: true },
                    { name: "currencySymbol", type: "text", required: true },
                    { name: "businessInfo", type: "json", required: true, options: { maxSize: 2000000 } },
                    { name: "clientInfo", type: "json", required: true, options: { maxSize: 2000000 } },
                    { name: "lineItems", type: "json", required: true, options: { maxSize: 2000000 } },
                    { name: "taxRate", type: "number", required: true },
                    { name: "notes", type: "text", required: false },
                    { name: "terms", type: "text", required: false },
                    {
                        name: "user",
                        type: "relation",
                        required: true,
                        options: { collectionId: "_pb_users_auth_", maxSelect: 1 }
                    }
                ] as any,
                // @ts-ignore — use setRules() for access control in tacobase
                listRule: "user = @request.auth.id",
                viewRule: "user = @request.auth.id",
                createRule: "user = @request.auth.id",
                updateRule: "user = @request.auth.id",
                deleteRule: "user = @request.auth.id",
            });
            console.log("✅ 'proposals' collection created.");
        } else {
            console.log("ℹ️ 'proposals' collection already exists.");
        }
        if (!existing.includes("companies")) {
            console.log("Creating 'companies' collection...");
            await pb.admin.createCollection({
                name: "companies",
                type: "flexible",
                schema: [
                    { name: "name", type: "text", required: true },
                    { name: "email", type: "text", required: false },
                    { name: "phone", type: "text", required: false },
                    { name: "address", type: "text", required: false },
                    { name: "city", type: "text", required: false },
                    { name: "country", type: "text", required: false },
                    { name: "logo", type: "json", required: false, options: { maxSize: 2000000 } },
                    { name: "baseProposalId", type: "number", required: true },
                    {
                        name: "user",
                        type: "relation",
                        required: true,
                        options: { collectionId: "_pb_users_auth_", maxSelect: 1 }
                    }
                ] as any,
                // @ts-ignore — use setRules() for access control in tacobase
                listRule: "user = @request.auth.id",
                viewRule: "user = @request.auth.id",
                createRule: "user = @request.auth.id",
                updateRule: "user = @request.auth.id",
                deleteRule: "user = @request.auth.id",
            });
            console.log("✅ 'companies' collection created.");
        } else {
            console.log("ℹ️ 'companies' collection already exists.");
        }
        if (!existing.includes("clients")) {
            console.log("Creating 'clients' collection...");
            await pb.admin.createCollection({
                name: "clients",
                type: "flexible",
                schema: [
                    { name: "name", type: "text", required: true },
                    { name: "email", type: "text", required: false },
                    { name: "phone", type: "text", required: false },
                    { name: "address", type: "text", required: false },
                    { name: "city", type: "text", required: false },
                    { name: "country", type: "text", required: false },
                    {
                        name: "user",
                        type: "relation",
                        required: true,
                        options: { collectionId: "_pb_users_auth_", maxSelect: 1 }
                    }
                ] as any,
                // @ts-ignore — use setRules() for access control in tacobase
                listRule: "user = @request.auth.id",
                viewRule: "user = @request.auth.id",
                createRule: "user = @request.auth.id",
                updateRule: "user = @request.auth.id",
                deleteRule: "user = @request.auth.id",
            });
            console.log("✅ 'clients' collection created.");
        } else {
            console.log("ℹ️ 'clients' collection already exists.");
        }

        if (!existing.includes("subscriptions")) {
            console.log("Creating 'subscriptions' collection...");
            await pb.admin.createCollection({
                name: "subscriptions",
                type: "flexible",
                schema: [
                    { name: "stripeCustomerId", type: "text", required: true },
                    { name: "stripeSubscriptionId", type: "text", required: true },
                    { name: "status", type: "text", required: true },
                    {
                        name: "user",
                        type: "relation",
                        required: true,
                        options: { collectionId: "_pb_users_auth_", maxSelect: 1 }
                    }
                ] as any,
                // @ts-ignore — use setRules() for access control in tacobase
                listRule: "user = @request.auth.id",
                viewRule: "user = @request.auth.id",
                createRule: null, // Only admin can create
                updateRule: null, // Only admin can update
                deleteRule: null, // Only admin can delete
            });
            console.log("✅ 'subscriptions' collection created.");
        } else {
            console.log("ℹ️ 'subscriptions' collection already exists.");
        }
    } catch (error: any) {
        console.error("❌ Failed to initialize collections:", error);
        if (error.response?.data?.schema) {
            console.error("Schema errors:", JSON.stringify(error.response.data.schema, null, 2));
        }
        process.exit(1);
    }
}

init();
