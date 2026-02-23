import { useEffect, useState } from "react";
import { useClient, useAuth } from "@picobase_app/react";
import { BusinessInfo } from "../types/proposal";

interface CompanyProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    logo: string | null;
    baseProposalId: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (company: BusinessInfo) => void;
}

export default function LoadCompanyModal({ isOpen, onClose, onSelect }: Props) {
    const client = useClient();
    const { user } = useAuth();
    const [companies, setCompanies] = useState<CompanyProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            client.collection("companies").getList(1, 50, {
                sort: "-created",
                filter: `user = "${user.id}"`,
            })
                .then((result) => {
                    setCompanies(result.items as unknown as CompanyProfile[]);
                })
                .catch((err) => console.error("Error loading companies:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user, client]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Load Company Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No saved companies found. Save a company from the editor first.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {companies.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => {
                                        onSelect({
                                            name: company.name,
                                            email: company.email || "",
                                            phone: company.phone || "",
                                            address: company.address || "",
                                            city: company.city || "",
                                            country: company.country || "",
                                            logo: company.logo || null,
                                            website: "", // Handle if not in schema
                                        });
                                        onClose();
                                    }}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                >
                                    {company.logo ? (
                                        <img src={company.logo} alt="Logo" className="w-8 h-8 object-contain" />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{company.name}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {[company.city, company.country].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
