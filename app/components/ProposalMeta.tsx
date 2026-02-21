"use client";

import { CURRENCIES, ProposalData } from "../types/proposal";

interface Props {
  data: Pick<ProposalData, "proposalNumber" | "proposalDate" | "validUntil" | "currency" | "currencySymbol" | "taxRate">;
  onChange: (updates: Partial<ProposalData>) => void;
}

export default function ProposalMeta({ data, onChange }: Props) {
  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find((c) => c.code === code);
    if (currency) {
      onChange({ currency: currency.code, currencySymbol: currency.symbol });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Proposal Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proposal #</label>
          <input
            type="text"
            value={data.proposalNumber}
            onChange={(e) => onChange({ proposalNumber: e.target.value })}
            placeholder="PRO-001"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={data.proposalDate}
            onChange={(e) => onChange({ proposalDate: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
          <input
            type="date"
            value={data.validUntil}
            onChange={(e) => onChange({ validUntil: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={data.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tax Rate (%)
        </label>
        <div className="flex items-center gap-2 max-w-[180px]">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={data.taxRate}
            onChange={(e) => onChange({ taxRate: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>
    </div>
  );
}
