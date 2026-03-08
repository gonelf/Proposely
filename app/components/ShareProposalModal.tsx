"use client";

import { useState } from "react";

interface ShareProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string | null;
  userId: string;
  clientEmail: string;
  clientName: string;
  proposalNumber: string;
}

export default function ShareProposalModal({
  isOpen,
  onClose,
  proposalId,
  userId,
  clientEmail,
  clientName,
  proposalNumber,
}: ShareProposalModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    if (!proposalId) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to share proposal");
        return;
      }
      setShareUrl(data.shareUrl);
      setEmailSent(data.emailSent);
      setDevCode(data.devCode || null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl(null);
    setDevCode(null);
    setEmailSent(false);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Send to Client</h2>
            <p className="text-sm text-gray-500 mt-0.5">{proposalNumber}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!shareUrl ? (
            <>
              {/* Pre-send state */}
              <div className="mb-5">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {clientName || "Client"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {clientEmail || <span className="italic text-gray-400">No email on file</span>}
                    </p>
                  </div>
                </div>
              </div>

              {!clientEmail && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    No client email found. A shareable link will be generated instead — you can copy and send it manually.
                  </p>
                </div>
              )}

              <div className="mb-5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-600">A secure link and 6-digit access code are generated</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {clientEmail
                      ? "An email with the link and code is sent to your client"
                      : "Copy the link and share it with your client along with the code"}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-600">Client views the proposal and signs online</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!proposalId && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">Save the proposal first before sending to a client.</p>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={isSending || !proposalId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {isSending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {clientEmail ? "Send Proposal Email" : "Generate Share Link"}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Post-send success state */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {emailSent ? "Email sent!" : "Link ready!"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {emailSent
                    ? `An email with the access code was sent to ${clientEmail}`
                    : "Share this link with your client along with the access code"}
                </p>
              </div>

              {/* Share link */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Proposal Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-gray-700 truncate font-mono">{shareUrl}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dev mode: show code when no email configured */}
              {devCode && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                    Dev mode — Access Code
                  </p>
                  <p className="text-2xl font-bold text-amber-900 tracking-widest">{devCode}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Configure RESEND_API_KEY to send this code via email in production.
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
