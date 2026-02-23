import { useEffect, useState } from "react";
import { useClient, useAuth } from "@picobase_app/react";
import { ProposalData } from "../types/proposal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (proposalId: string, data: ProposalData) => void;
}

export default function LoadProposalModal({ isOpen, onClose, onSelect }: Props) {
    const client = useClient();
    const { user } = useAuth();
    const [proposals, setProposals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            client.collection("proposals").getList(1, 50, {
                sort: "-created",
                filter: `user = "${user.id}"`,
            })
                .then((result) => {
                    setProposals(result.items);
                })
                .catch((err) => console.error("Error loading proposals:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user, client]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Load Saved Proposal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                    ) : proposals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No saved proposals found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {proposals.map((prop) => {
                                let amount = 0;
                                try {
                                    const items = typeof prop.lineItems === 'string' ? JSON.parse(prop.lineItems) : prop.lineItems;
                                    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
                                    amount = subtotal + (subtotal * (prop.taxRate / 100));
                                } catch (e) { }

                                return (
                                    <button
                                        key={prop.id}
                                        onClick={() => {
                                            onSelect(prop.id, {
                                                proposalNumber: prop.proposalNumber,
                                                proposalDate: prop.proposalDate,
                                                validUntil: prop.validUntil,
                                                currency: prop.currency,
                                                currencySymbol: prop.currencySymbol,
                                                businessInfo: typeof prop.businessInfo === 'string' ? JSON.parse(prop.businessInfo) : prop.businessInfo,
                                                clientInfo: typeof prop.clientInfo === 'string' ? JSON.parse(prop.clientInfo) : prop.clientInfo,
                                                lineItems: typeof prop.lineItems === 'string' ? JSON.parse(prop.lineItems) : prop.lineItems,
                                                taxRate: prop.taxRate,
                                                notes: prop.notes,
                                                terms: prop.terms,
                                            });
                                            onClose();
                                        }}
                                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-between gap-3"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {prop.proposalNumber}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(prop.created).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {prop.currencySymbol}{amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
