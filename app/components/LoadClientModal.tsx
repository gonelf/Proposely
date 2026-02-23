import { useEffect, useState } from "react";
import { useClient, useAuth } from "@picobase_app/react";
import { ClientInfo } from "../types/proposal";

interface ClientProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (client: ClientInfo) => void;
}

export default function LoadClientModal({ isOpen, onClose, onSelect }: Props) {
    const pbClient = useClient();
    const { user } = useAuth();
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            pbClient.collection("clients").getList(1, 50, {
                sort: "-created",
                filter: `user = "${user.id}"`,
            })
                .then((result) => {
                    setClients(result.items as unknown as ClientProfile[]);
                })
                .catch((err) => console.error("Error loading clients:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user, pbClient]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Load Client Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                    ) : clients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No saved clients found. Save a client from the editor first.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {clients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        onSelect({
                                            name: client.name,
                                            email: client.email || "",
                                            phone: client.phone || "",
                                            address: client.address || "",
                                            city: client.city || "",
                                            country: client.country || "",
                                        });
                                        onClose();
                                    }}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 flex-shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{client.name}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {client.email || [client.city, client.country].filter(Boolean).join(", ") || "No additional info"}
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
