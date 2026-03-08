import { NextResponse } from "next/server";
import { createClient } from "@tacobase/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
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

    if (proposal.accessCode !== code.trim()) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 401 });
    }

    if (proposal.accessCodeExpiry && new Date(proposal.accessCodeExpiry) < new Date()) {
      return NextResponse.json({ error: "This code has expired. Ask the sender to resend." }, { status: 401 });
    }

    // Mark as viewed if still in sent state
    if (proposal.shareStatus === "sent") {
      await pb.collection("proposals").update(proposal.id, { shareStatus: "viewed" });
    }

    const businessInfo =
      typeof proposal.businessInfo === "string"
        ? JSON.parse(proposal.businessInfo)
        : proposal.businessInfo;
    const clientInfo =
      typeof proposal.clientInfo === "string"
        ? JSON.parse(proposal.clientInfo)
        : proposal.clientInfo;
    const lineItems =
      typeof proposal.lineItems === "string"
        ? JSON.parse(proposal.lineItems)
        : proposal.lineItems;

    return NextResponse.json({
      id: proposal.id,
      proposalNumber: proposal.proposalNumber,
      proposalDate: proposal.proposalDate,
      validUntil: proposal.validUntil,
      currency: proposal.currency,
      currencySymbol: proposal.currencySymbol,
      businessInfo,
      clientInfo,
      lineItems,
      taxRate: proposal.taxRate,
      notes: proposal.notes,
      terms: proposal.terms,
      shareStatus: proposal.shareStatus === "sent" ? "viewed" : proposal.shareStatus,
      signedAt: proposal.signedAt || null,
      signerName: proposal.signerName || null,
      signatureData: proposal.signedAt ? proposal.signatureData : null,
    });
  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
