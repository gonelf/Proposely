"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { use } from "react";

interface ProposalInfo {
  proposalNumber: string;
  proposalDate: string;
  businessName: string;
  clientName: string;
  shareStatus: string;
  isSigned: boolean;
  signerName: string | null;
  signedAt: string | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FullProposal {
  id: string;
  proposalNumber: string;
  proposalDate: string;
  validUntil: string;
  currency: string;
  currencySymbol: string;
  businessInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    website: string;
    logo: string | null;
  };
  clientInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  lineItems: LineItem[];
  taxRate: number;
  notes: string;
  terms: string;
  shareStatus: string;
  signedAt: string | null;
  signerName: string | null;
  signatureData: string | null;
}

type PageState = "loading" | "not-found" | "verify" | "proposal" | "signed-success";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function OtpInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    const newVal = next.join("");
    onChange(newVal);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (newVal.length === 6 && newVal.replace(/\D/g, "").length === 6) {
      onSubmit();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = "";
      onChange(next.join(""));
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) onSubmit();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all bg-white"
        />
      ))}
    </div>
  );
}

function SignatureCanvas({
  onCapture,
}: {
  onCapture: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      hasDrawn.current = true;
      onCapture(canvas.toDataURL("image/png"));
    };

    const stopDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [onCapture]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onCapture(null);
  };

  return (
    <div>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-40 cursor-crosshair touch-none"
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="w-48 border-b border-gray-300" />
          <p className="text-xs text-gray-400 text-center mt-1">Sign above</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
      >
        Clear signature
      </button>
    </div>
  );
}

export default function ProposalViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [proposalInfo, setProposalInfo] = useState<ProposalInfo | null>(null);
  const [proposal, setProposal] = useState<FullProposal | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  // Signing state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proposals/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setPageState("not-found");
          return;
        }
        setProposalInfo(data);
        setPageState("verify");
      })
      .catch(() => setPageState("not-found"));
  }, [token]);

  const handleVerify = useCallback(async () => {
    if (codeValue.length !== 6) return;
    setIsVerifying(true);
    setCodeError(null);
    try {
      const res = await fetch(`/api/proposals/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || "Invalid code");
        setIsVerifying(false);
        return;
      }
      setProposal(data);
      setVerifiedCode(codeValue);
      setPageState("proposal");
    } catch {
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [codeValue, token]);

  const handleSign = async () => {
    if (!signerName.trim() || !signatureData || !verifiedCode) return;
    setIsSigning(true);
    setSignError(null);
    try {
      const res = await fetch(`/api/proposals/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureData,
          code: verifiedCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignError(data.error || "Failed to sign. Please try again.");
        setIsSigning(false);
        return;
      }
      setPageState("signed-success");
      setShowSignModal(false);
    } catch {
      setSignError("Something went wrong. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────────────
  if (pageState === "not-found") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Proposal not found</h1>
          <p className="text-gray-500 text-sm">This proposal link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  // ─── Verification gate ─────────────────────────────────────────────────────
  if (pageState === "verify" && proposalInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Proposely badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
              <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Proposely</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Proposal context */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Proposal {proposalInfo.proposalNumber}</h1>
              <p className="text-sm text-gray-500">
                from <span className="font-semibold text-gray-700">{proposalInfo.businessName || "your contact"}</span>
              </p>
              {proposalInfo.clientName && (
                <p className="text-sm text-gray-400 mt-0.5">for {proposalInfo.clientName}</p>
              )}
            </div>

            {proposalInfo.isSigned ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200 mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Signed
                </div>
                <p className="text-sm text-gray-500">
                  This proposal was signed by <strong>{proposalInfo.signerName}</strong>
                  {proposalInfo.signedAt && (
                    <> on {formatDate(proposalInfo.signedAt)}</>
                  )}.
                </p>
                <p className="text-xs text-gray-400 mt-2">Enter your access code to view the proposal details.</p>
              </div>
            ) : null}

            {/* Code entry */}
            <div className="mt-6">
              <p className="text-sm text-center text-gray-600 mb-5">
                Enter the 6-digit access code from your email
              </p>

              <OtpInput
                value={codeValue}
                onChange={(v) => {
                  setCodeValue(v);
                  setCodeError(null);
                }}
                onSubmit={handleVerify}
              />

              {codeError && (
                <p className="text-sm text-red-500 text-center mt-3">{codeError}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={codeValue.length !== 6 || isVerifying}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  "View Proposal"
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Secure document sharing via Proposely
          </p>
        </div>
      </div>
    );
  }

  // ─── Signed success ────────────────────────────────────────────────────────
  if (pageState === "signed-success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Signed!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            You have successfully signed proposal <strong>{proposal?.proposalNumber}</strong>.
            The sender has been notified.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Powered by Proposely
          </div>
        </div>
      </div>
    );
  }

  // ─── Full proposal view ────────────────────────────────────────────────────
  if (pageState === "proposal" && proposal) {
    const subtotal = proposal.lineItems.reduce((s, i) => s + i.total, 0);
    const taxAmount = subtotal * (proposal.taxRate / 100);
    const total = subtotal + taxAmount;
    const fmt = (n: number) =>
      `${proposal.currencySymbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const isAlreadySigned = !!proposal.signedAt;

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Top nav */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Proposely</span>
            </div>
            <div className="flex items-center gap-3">
              {isAlreadySigned ? (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Signed
                </span>
              ) : (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Proposal
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Proposal document */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Document header */}
            <div className="bg-blue-600 px-8 py-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {proposal.businessInfo.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proposal.businessInfo.logo}
                      alt={proposal.businessInfo.name}
                      className="h-12 w-auto object-contain mb-3 rounded"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-white">{proposal.businessInfo.name || "Your Business"}</h2>
                  {proposal.businessInfo.website && (
                    <p className="text-blue-200 text-sm mt-0.5">{proposal.businessInfo.website}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Proposal</p>
                  <p className="text-white text-2xl font-bold mt-0.5">{proposal.proposalNumber}</p>
                </div>
              </div>
            </div>

            {/* From / Bill To + dates */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From</p>
                  <p className="font-semibold text-gray-900">{proposal.businessInfo.name}</p>
                  {proposal.businessInfo.email && <p className="text-sm text-gray-500">{proposal.businessInfo.email}</p>}
                  {proposal.businessInfo.phone && <p className="text-sm text-gray-500">{proposal.businessInfo.phone}</p>}
                  {proposal.businessInfo.address && <p className="text-sm text-gray-500">{proposal.businessInfo.address}</p>}
                  {(proposal.businessInfo.city || proposal.businessInfo.country) && (
                    <p className="text-sm text-gray-500">
                      {[proposal.businessInfo.city, proposal.businessInfo.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
                  <p className="font-semibold text-gray-900">{proposal.clientInfo.name}</p>
                  {proposal.clientInfo.email && <p className="text-sm text-gray-500">{proposal.clientInfo.email}</p>}
                  {proposal.clientInfo.phone && <p className="text-sm text-gray-500">{proposal.clientInfo.phone}</p>}
                  {proposal.clientInfo.address && <p className="text-sm text-gray-500">{proposal.clientInfo.address}</p>}
                  {(proposal.clientInfo.city || proposal.clientInfo.country) && (
                    <p className="text-sm text-gray-500">
                      {[proposal.clientInfo.city, proposal.clientInfo.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(proposal.proposalDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valid Until</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(proposal.validUntil)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Currency</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{proposal.currency}</p>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="px-8 py-6 border-b border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-right pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Qty</th>
                    <th className="text-right pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Unit Price</th>
                    <th className="text-right pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.lineItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-3 pr-4 text-gray-900">{item.description}</td>
                      <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-1.5 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {proposal.taxRate > 0 && (
                    <div className="flex justify-between py-1.5 text-sm text-gray-600">
                      <span>Tax ({proposal.taxRate}%)</span>
                      <span>{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5 text-base font-bold text-gray-900 border-t-2 border-gray-900 mt-1">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes + Terms */}
            {(proposal.notes || proposal.terms) && (
              <div className="px-8 py-6 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {proposal.notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{proposal.notes}</p>
                  </div>
                )}
                {proposal.terms && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{proposal.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signature section */}
            <div className="px-8 py-6">
              {isAlreadySigned ? (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Signed by {proposal.signerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {proposal.signedAt ? formatDate(proposal.signedAt) : ""}
                    </p>
                    {proposal.signatureData && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proposal.signatureData}
                        alt="Signature"
                        className="mt-3 h-16 object-contain border-b border-gray-300 pb-1"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Review the proposal above and click below to sign.
                  </p>
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Sign Proposal
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Signature modal */}
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Sign Proposal</h2>
                <button
                  onClick={() => setShowSignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Signature
                  </label>
                  <SignatureCanvas onCapture={setSignatureData} />
                </div>

                {signError && (
                  <p className="text-sm text-red-500">{signError}</p>
                )}

                <div className="text-xs text-gray-400 leading-relaxed">
                  By clicking &ldquo;Sign&rdquo;, you agree that this electronic signature is the legal equivalent of your handwritten signature.
                </div>

                <button
                  onClick={handleSign}
                  disabled={!signerName.trim() || !signatureData || isSigning}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSigning ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Sign Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
