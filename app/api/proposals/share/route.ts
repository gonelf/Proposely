import { NextResponse } from "next/server";
import { createClient } from "@tacobase/client";

function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function buildEmailHtml(params: {
  clientName: string;
  businessName: string;
  proposalNumber: string;
  proposalUrl: string;
  accessCode: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proposal from ${params.businessName}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:#2563eb;padding:28px 40px;">
        <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:-0.3px;">Proposely</span>
      </div>
      <div style="padding:40px;">
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">You have a proposal to review</h1>
        <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
          Hi${params.clientName ? " " + params.clientName : ""},<br><br>
          <strong style="color:#111827;">${params.businessName || "Your contact"}</strong> has sent you proposal <strong style="color:#111827;">${params.proposalNumber}</strong> for your review and signature.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:24px;margin-bottom:28px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your access code</p>
          <p style="margin:0;font-size:40px;font-weight:800;color:#111827;letter-spacing:10px;font-variant-numeric:tabular-nums;">${params.accessCode}</p>
          <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Valid for 7 days &mdash; do not share this code</p>
        </div>
        <a href="${params.proposalUrl}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;">
          View &amp; Sign Proposal &rarr;
        </a>
        <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;word-break:break-all;">
          Or paste this URL in your browser:<br>
          <a href="${params.proposalUrl}" style="color:#2563eb;">${params.proposalUrl}</a>
        </p>
      </div>
      <div style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Sent via Proposely &middot; Professional Proposal Software</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const { proposalId, userId } = await req.json();

    if (!proposalId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pbUrl = process.env.NEXT_PUBLIC_TACOBASE_URL;
    const adminKey = process.env.TACOBASE_ADMIN_API_KEY;

    if (!pbUrl || !adminKey) {
      return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
    }

    const pb = createClient(pbUrl, adminKey);

    let proposal;
    try {
      proposal = await pb.collection("proposals").getOne(proposalId) as Record<string, any>;
    } catch {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.user !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const shareToken = generateShareToken();
    const accessCode = generateAccessCode();
    const accessCodeExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await pb.collection("proposals").update(proposalId, {
      shareToken,
      accessCode,
      accessCodeExpiry,
      shareStatus: "sent",
      signedAt: null,
      signerName: null,
      signatureData: null,
    });

    const clientInfo =
      typeof proposal.clientInfo === "string"
        ? JSON.parse(proposal.clientInfo)
        : proposal.clientInfo;
    const businessInfo =
      typeof proposal.businessInfo === "string"
        ? JSON.parse(proposal.businessInfo)
        : proposal.businessInfo;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/p/${shareToken}`;

    let emailSent = false;
    if (process.env.RESEND_API_KEY && clientInfo?.email) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "proposals@proposely.app",
          to: clientInfo.email,
          subject: `Proposal ${proposal.proposalNumber} from ${businessInfo?.name || "Your Vendor"}`,
          html: buildEmailHtml({
            clientName: clientInfo.name || "",
            businessName: businessInfo?.name || "",
            proposalNumber: proposal.proposalNumber,
            proposalUrl: shareUrl,
            accessCode,
          }),
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      shareUrl,
      emailSent,
      // Return code in dev when no email is configured so devs can test
      devCode:
        process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
          ? accessCode
          : undefined,
    });
  } catch (err) {
    console.error("Share proposal error:", err);
    return NextResponse.json({ error: "Failed to share proposal" }, { status: 500 });
  }
}
