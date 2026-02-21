"use client";

import { useState } from "react";
import ProposalEditor from "./components/ProposalEditor";
import ProposalPreview from "./components/ProposalPreview";
import { ProposalData } from "./types/proposal";

const today = new Date().toISOString().split("T")[0];
const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

const defaultProposal: ProposalData = {
  proposalNumber: "PRO-001",
  proposalDate: today,
  validUntil: validUntil,
  currency: "USD",
  currencySymbol: "$",
  businessInfo: {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
    logo: null,
  },
  clientInfo: {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  },
  lineItems: [
    { id: "1", description: "Consulting services", quantity: 1, unitPrice: 1500, total: 1500 },
    { id: "2", description: "Design & development", quantity: 20, unitPrice: 95, total: 1900 },
  ],
  taxRate: 10,
  notes: "",
  terms: "Payment due within 30 days of proposal acceptance.",
};

type Tab = "editor" | "preview";

export default function Home() {
  const [proposal, setProposal] = useState<ProposalData>(defaultProposal);
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [isGenerating, setIsGenerating] = useState(false);

  const updateProposal = (updates: Partial<ProposalData>) => {
    setProposal((prev) => ({ ...prev, ...updates }));
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const { generateProposalPdf } = await import("./utils/generatePdf");
      await generateProposalPdf(proposal);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const subtotal = proposal.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (proposal.taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">Proposely</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Total pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <span className="text-xs text-blue-400">{proposal.currency}</span>
                {proposal.currencySymbol}{total.toFixed(2)}
              </div>

              {/* Mobile tab toggle */}
              <div className="flex lg:hidden bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "editor" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  PDF Preview
                </button>
              </div>

              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Editor column */}
          <div className={`flex-1 min-w-0 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
            <ProposalEditor data={proposal} onChange={updateProposal} />
          </div>

          {/* Preview column */}
          <div className={`w-full lg:w-[420px] xl:w-[480px] shrink-0 ${activeTab === "editor" ? "hidden lg:block" : ""}`}>
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PDF Preview</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  Read-only
                </span>
              </div>
              <ProposalPreview data={proposal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
