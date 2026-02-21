"use client";

import { ProposalData } from "../types/proposal";

interface Props {
  data: ProposalData;
}

export default function ProposalPreview({ data }: Props) {
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;
  const sym = data.currencySymbol;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-[13px]">
      {/* Header */}
      <div className="bg-slate-50 border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          {/* Logo / Company */}
          <div>
            {data.businessInfo.logo && (
              <img
                src={data.businessInfo.logo}
                alt="logo"
                className="h-12 w-auto max-w-[140px] object-contain mb-2"
              />
            )}
            <p className="font-bold text-gray-900 text-base leading-tight">
              {data.businessInfo.name || <span className="text-gray-300">Your Company</span>}
            </p>
            {data.businessInfo.email && <p className="text-gray-500 text-xs">{data.businessInfo.email}</p>}
            {data.businessInfo.phone && <p className="text-gray-500 text-xs">{data.businessInfo.phone}</p>}
            {(data.businessInfo.address || data.businessInfo.city) && (
              <p className="text-gray-500 text-xs">
                {[data.businessInfo.address, data.businessInfo.city, data.businessInfo.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          {/* Proposal info */}
          <div className="text-right">
            <p className="font-bold text-blue-600 text-xl">PROPOSAL</p>
            <p className="text-gray-500 text-xs"># {data.proposalNumber || "—"}</p>
            {data.proposalDate && <p className="text-gray-500 text-xs mt-0.5">Date: {data.proposalDate}</p>}
            {data.validUntil && <p className="text-gray-500 text-xs">Valid: {data.validUntil}</p>}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</p>
        <p className="font-semibold text-gray-900">
          {data.clientInfo.name || <span className="text-gray-300">Client Name</span>}
        </p>
        {data.clientInfo.email && <p className="text-gray-500 text-xs">{data.clientInfo.email}</p>}
        {data.clientInfo.phone && <p className="text-gray-500 text-xs">{data.clientInfo.phone}</p>}
        {(data.clientInfo.address || data.clientInfo.city) && (
          <p className="text-gray-500 text-xs">
            {[data.clientInfo.address, data.clientInfo.city, data.clientInfo.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {/* Line Items */}
      <div className="p-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left px-2 py-1.5 rounded-l font-semibold">Description</th>
              <th className="text-right px-2 py-1.5 font-semibold w-12">Qty</th>
              <th className="text-right px-2 py-1.5 font-semibold w-20">Unit Price</th>
              <th className="text-right px-2 py-1.5 rounded-r font-semibold w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-300">
                  No items added yet
                </td>
              </tr>
            ) : (
              data.lineItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1.5 text-gray-700">{item.description || "—"}</td>
                  <td className="px-2 py-1.5 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-2 py-1.5 text-right text-gray-600">{sym}{item.unitPrice.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-medium text-gray-800">{sym}{item.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Subtotal</span>
              <span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {data.taxRate > 0 && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Tax ({data.taxRate}%)</span>
                <span>{sym}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-blue-200 pt-1.5 font-bold text-gray-900 text-sm">
              <span>Total</span>
              <span className="text-blue-600">{data.currency} {sym}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {(data.notes || data.terms) && (
        <div className="px-6 pb-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          {data.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
          {data.terms && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Terms</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{data.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
