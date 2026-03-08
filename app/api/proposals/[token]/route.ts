import { NextResponse } from "next/server";
import { createClient } from "@tacobase/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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
    const businessInfo =
      typeof proposal.businessInfo === "string"
        ? JSON.parse(proposal.businessInfo)
        : proposal.businessInfo;
    const clientInfo =
      typeof proposal.clientInfo === "string"
        ? JSON.parse(proposal.clientInfo)
        : proposal.clientInfo;

    // Return only minimal public info — full data requires code verification
    return NextResponse.json({
      proposalNumber: proposal.proposalNumber,
      proposalDate: proposal.proposalDate,
      businessName: businessInfo?.name || "",
      clientName: clientInfo?.name || "",
      shareStatus: proposal.shareStatus || "sent",
      isSigned: !!proposal.signedAt,
      signerName: proposal.signedAt ? proposal.signerName : null,
      signedAt: proposal.signedAt || null,
    });
  } catch (err) {
    console.error("Get proposal info error:", err);
    return NextResponse.json({ error: "Failed to load proposal" }, { status: 500 });
  }
}
