"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClient } from "@picobase_app/react";
import ProposalEditor from "./components/ProposalEditor";
import ProposalPreview from "./components/ProposalPreview";
import LoadProposalModal from "./components/LoadProposalModal";
import LoadClientModal from "./components/LoadClientModal";
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
  const { user, signOut } = useAuth();
  const client = useClient();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalData>(defaultProposal);
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoadClientModalOpen, setIsLoadClientModalOpen] = useState(false);
  const [isLoadProposalModalOpen, setIsLoadProposalModalOpen] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isCheckingSub, setIsCheckingSub] = useState(true);

  useEffect(() => {
    if (user) {
      setIsCheckingSub(true);
      client.collection("subscriptions").getList(1, 1, {
        filter: `user="${user.id}" && status="active"`,
      }).then((subResult) => {
        if (subResult.items && subResult.items.length > 0) {
          setHasSubscription(true);
          Promise.all([
            client.collection("proposals").getList(1, 1, {
              sort: "-created",
              filter: `user = "${user.id}"`,
            }),
            client.collection("companies").getList(1, 1, {
              filter: `user = "${user.id}"`,
            })
          ]).then(([propResult, compResult]) => {
            let loadedCompany = null;
            if (compResult.items.length > 0) {
              const comp = compResult.items[0];
              loadedCompany = {
                name: comp.name || "",
                email: comp.email || "",
                phone: comp.phone || "",
                address: comp.address || "",
                city: comp.city || "",
                country: comp.country || "",
                logo: comp.logo || null,
              };
            }

            if (propResult.items.length > 0) {
              const item = propResult.items[0];
              setProposal({
                proposalNumber: item.proposalNumber,
                proposalDate: item.proposalDate,
                validUntil: item.validUntil,
                currency: item.currency,
                currencySymbol: item.currencySymbol,
                businessInfo: loadedCompany || (typeof item.businessInfo === 'string' ? JSON.parse(item.businessInfo) : item.businessInfo),
                clientInfo: typeof item.clientInfo === 'string' ? JSON.parse(item.clientInfo) : item.clientInfo,
                lineItems: typeof item.lineItems === 'string' ? JSON.parse(item.lineItems) : item.lineItems,
                taxRate: item.taxRate,
                notes: item.notes,
                terms: item.terms,
              });
              setProposalId(item.id);
            } else if (loadedCompany) {
              setProposal(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, ...loadedCompany } }));
            }
          }).catch((err) => {
            console.error("Error loading data:", err);
          });
        } else {
          setHasSubscription(false);
        }
      }).catch((err) => {
        console.error("Error checking subscription:", err);
        setHasSubscription(false);
      }).finally(() => {
        setIsCheckingSub(false);
      });
    } else {
      setHasSubscription(null);
      setIsCheckingSub(false);
      setProposal(defaultProposal);
      setProposalId(null);
    }
  }, [user, client, router]);

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleSave = async () => {
    if (!user) return alert("Please sign in to save your proposal.");
    if (hasSubscription === false) {
      alert("Please upgrade to Pro to save proposals.");
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        ...proposal,
        user: user.id
      };

      if (proposalId) {
        await client.collection("proposals").update(proposalId, data);
        alert("Proposal updated successfully!");
      } else {
        const record = await client.collection("proposals").create(data);
        setProposalId(record.id);
        alert("Proposal saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save proposal:", err);
      alert("Failed to save proposal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateProposal = (updates: Partial<ProposalData>) => {
    setProposal((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveCompany = async () => {
    if (!user) return alert("Please sign in to save company info.");
    if (hasSubscription === false) {
      alert("Please upgrade to Pro to save companies.");
      return;
    }
    if (!proposal.businessInfo.name) return alert("Company name is required to save.");
    setIsSavingCompany(true);
    try {
      const records = await client.collection("companies").getList(1, 1, {
        filter: `user = "${user.id}"`,
      });

      const payload = {
        name: proposal.businessInfo.name,
        email: proposal.businessInfo.email,
        phone: proposal.businessInfo.phone,
        address: proposal.businessInfo.address,
        city: proposal.businessInfo.city,
        country: proposal.businessInfo.country,
        logo: proposal.businessInfo.logo,
        baseProposalId: parseInt(proposal.proposalNumber.replace(/\D/g, "") || "1", 10),
        user: user.id,
      };

      if (records.items.length > 0) {
        await client.collection("companies").update(records.items[0].id, payload);
        alert("Company updated successfully!");
      } else {
        await client.collection("companies").create(payload);
        alert("Company saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save company:", err);
      alert("Failed to save company. Please try again.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSaveClient = async () => {
    if (!user) return alert("Please sign in to save client info.");
    if (hasSubscription === false) {
      alert("Please upgrade to Pro to save clients.");
      return;
    }
    if (!proposal.clientInfo.name) return alert("Client name is required to save.");
    setIsSavingClient(true);
    try {
      const records = await client.collection("clients").getList(1, 1, {
        filter: `user = "${user.id}" && name = "${proposal.clientInfo.name}"`,
      });

      const payload = {
        name: proposal.clientInfo.name,
        email: proposal.clientInfo.email,
        phone: proposal.clientInfo.phone,
        address: proposal.clientInfo.address,
        city: proposal.clientInfo.city,
        country: proposal.clientInfo.country,
        user: user.id,
      };

      if (records.items.length > 0) {
        await client.collection("clients").update(records.items[0].id, payload);
        alert("Client updated successfully!");
      } else {
        await client.collection("clients").create(payload);
        alert("Client saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save client:", err);
      alert("Failed to save client. Please try again.");
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (hasSubscription === false) {
      alert("Please upgrade to Pro to download high-quality PDFs.");
      return;
    }
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
      {isCheckingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

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
              {/* User auth state */}
              {user ? (
                <div className="hidden sm:flex items-center gap-3 mr-2 pr-4 border-r border-gray-200">
                  <span className="text-sm text-gray-600 truncate max-w-[150px]" title={user.email}>{user.email}</span>
                  <button onClick={signOut} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3 mr-2 pr-4 border-r border-gray-200">
                  <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Sign In
                  </Link>
                </div>
              )}

              {(!user || hasSubscription === false) && (
                <button
                  onClick={() => router.push("/checkout")}
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Pro
                </button>
              )}

              {/* Total pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <span className="text-xs text-blue-400">{proposal.currency}</span>
                {proposal.currencySymbol}{total.toFixed(2)}
              </div>

              <div className="flex lg:hidden bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === "editor" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                >
                  PDF Preview
                </button>
              </div>

              {user && (
                <button
                  onClick={() => setIsLoadProposalModalOpen(true)}
                  className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Proposals
                </button>
              )}

              {user && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              )}

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
            <ProposalEditor
              data={proposal}
              onChange={updateProposal}
              isSavingCompany={isSavingCompany}
              onSaveCompany={handleSaveCompany}
              isSavingClient={isSavingClient}
              onSaveClient={handleSaveClient}
              onLoadClientClick={() => setIsLoadClientModalOpen(true)}
            />
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

      <LoadClientModal
        isOpen={isLoadClientModalOpen}
        onClose={() => setIsLoadClientModalOpen(false)}
        onSelect={(clientInfo) => updateProposal({ clientInfo })}
      />

      <LoadProposalModal
        isOpen={isLoadProposalModalOpen}
        onClose={() => setIsLoadProposalModalOpen(false)}
        onSelect={(id, data) => {
          setProposal(data);
          setProposalId(id);
        }}
      />
    </div>
  );
}
