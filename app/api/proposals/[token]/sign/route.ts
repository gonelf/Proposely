import { NextResponse } from "next/server";
import { createClient } from "@tacobase/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { signerName, signatureData, code } = await req.json();

  if (!signerName || !signatureData || !code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pbUrl = process.env.NEXT_PUBLIC_TACOBASE_URL;
  const adminKey = process.env.TACOBASE_ADMIN_API_KEY;

  if (!pbUrl || !adminKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const pb = createClient(pbUrl, adminKey);

  try {
    const result = await pb.collection("proposals").getList(1, 1, {
      filter: `shareToken="${token}"`,
    });

    if (!result.items || result.items.length === 0) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const proposal = result.items[0] as Record<string, any>;

    // Re-verify the code for security
    if (proposal.accessCode !== code.trim()) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    if (proposal.signedAt) {
      return NextResponse.json({ error: "This proposal has already been signed" }, { status: 400 });
    }

    const signedAt = new Date().toISOString();

    await pb.collection("proposals").update(proposal.id, {
      signedAt,
      signerName: signerName.trim(),
      signatureData,
      shareStatus: "signed",
    });

    return NextResponse.json({ success: true, signedAt });
  } catch (err) {
    console.error("Sign proposal error:", err);
    return NextResponse.json({ error: "Failed to sign proposal" }, { status: 500 });
  }
}
