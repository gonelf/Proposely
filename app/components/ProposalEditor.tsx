"use client";

import { useRef } from "react";
import { CURRENCIES, ProposalData, BusinessInfo, ClientInfo, LineItem } from "../types/proposal";

interface Props {
  data: ProposalData;
  onChange: (updates: Partial<ProposalData>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Shared inline input style — looks like document text, reveals underline on hover/focus
const field =
  "bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none transition-colors placeholder:text-gray-300";

export default function ProposalEditor({ data, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sym = data.currencySymbol;

  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  const updateBusiness = (key: keyof BusinessInfo, value: string) => {
    onChange({ businessInfo: { ...data.businessInfo, [key]: value } });
  };

  const updateClient = (key: keyof ClientInfo, value: string) => {
    onChange({ clientInfo: { ...data.clientInfo, [key]: value } });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      onChange({ businessInfo: { ...data.businessInfo, logo: ev.target?.result as string } });
    reader.readAsDataURL(file);
  };

  const updateItem = (id: string, key: keyof LineItem, value: string | number) => {
    onChange({
      lineItems: data.lineItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: value };
        if (key === "quantity" || key === "unitPrice") {
          updated.total =
            (key === "quantity" ? Number(value) : item.quantity) *
            (key === "unitPrice" ? Number(value) : item.unitPrice);
        }
        return updated;
      }),
    });
  };

  const addItem = () =>
    onChange({
      lineItems: [
        ...data.lineItems,
        { id: generateId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    });

  const removeItem = (id: string) =>
    onChange({ lineItems: data.lineItems.filter((item) => item.id !== id) });

  const handleCurrencyChange = (code: string) => {
    const c = CURRENCIES.find((c) => c.code === code);
    if (c) onChange({ currency: c.code, currencySymbol: c.symbol });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-[13px]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-b border-gray-200 p-6">
        <div className="flex justify-between items-start gap-6">

          {/* Left: logo + business contact */}
          <div className="flex-1 min-w-0">
            {/* Logo */}
            <div className="mb-2">
              {data.businessInfo.logo ? (
                <div className="group relative inline-block">
                  <img
                    src={data.businessInfo.logo}
                    alt="logo"
                    className="h-12 w-auto max-w-[140px] object-contain cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to change logo"
                  />
                  <button
                    onClick={() => onChange({ businessInfo: { ...data.businessInfo, logo: null } })}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    title="Remove logo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 border border-dashed border-gray-300 rounded flex items-center gap-1 text-[11px] text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add logo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Company name */}
            <input
              type="text"
              value={data.businessInfo.name}
              onChange={(e) => updateBusiness("name", e.target.value)}
              placeholder="Your Company"
              className={`${field} font-bold text-gray-900 text-base leading-tight w-full max-w-[220px]`}
            />

            {/* Email */}
            <input
              type="email"
              value={data.businessInfo.email}
              onChange={(e) => updateBusiness("email", e.target.value)}
              placeholder="email@company.com"
              className={`${field} text-gray-500 text-xs block w-full max-w-[220px] mt-0.5`}
            />

            {/* Phone */}
            <input
              type="tel"
              value={data.businessInfo.phone}
              onChange={(e) => updateBusiness("phone", e.target.value)}
              placeholder="+1 555 000 0000"
              className={`${field} text-gray-500 text-xs block w-full max-w-[220px] mt-0.5`}
            />

            {/* Address */}
            <input
              type="text"
              value={data.businessInfo.address}
              onChange={(e) => updateBusiness("address", e.target.value)}
              placeholder="Street address"
              className={`${field} text-gray-500 text-xs block w-full max-w-[220px] mt-0.5`}
            />

            {/* City · Country */}
            <div className="flex gap-2 mt-0.5">
              <input
                type="text"
                value={data.businessInfo.city}
                onChange={(e) => updateBusiness("city", e.target.value)}
                placeholder="City"
                className={`${field} text-gray-500 text-xs w-24`}
              />
              <input
                type="text"
                value={data.businessInfo.country}
                onChange={(e) => updateBusiness("country", e.target.value)}
                placeholder="Country"
                className={`${field} text-gray-500 text-xs w-24`}
              />
            </div>
          </div>

          {/* Right: PROPOSAL label + meta */}
          <div className="text-right shrink-0">
            <p className="font-bold text-blue-600 text-xl">PROPOSAL</p>

            {/* Proposal # */}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-gray-400 text-xs">#</span>
              <input
                type="text"
                value={data.proposalNumber}
                onChange={(e) => onChange({ proposalNumber: e.target.value })}
                placeholder="PRO-001"
                className={`${field} text-gray-500 text-xs text-right w-20`}
              />
            </div>

            {/* Currency */}
            <div className="flex items-center justify-end mt-0.5">
              <select
                value={data.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className={`${field} text-gray-500 text-xs text-right`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-gray-400 text-xs">Date:</span>
              <input
                type="date"
                value={data.proposalDate}
                onChange={(e) => onChange({ proposalDate: e.target.value })}
                className={`${field} text-gray-500 text-xs text-right w-32`}
              />
            </div>

            {/* Valid until */}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-gray-400 text-xs">Valid:</span>
              <input
                type="date"
                value={data.validUntil}
                onChange={(e) => onChange({ validUntil: e.target.value })}
                className={`${field} text-gray-500 text-xs text-right w-32`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bill To ────────────────────────────────────────────── */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</p>

        <input
          type="text"
          value={data.clientInfo.name}
          onChange={(e) => updateClient("name", e.target.value)}
          placeholder="Client Name"
          className={`${field} font-semibold text-gray-900 w-full max-w-[260px]`}
        />
        <input
          type="email"
          value={data.clientInfo.email}
          onChange={(e) => updateClient("email", e.target.value)}
          placeholder="client@company.com"
          className={`${field} text-gray-500 text-xs block w-full max-w-[260px] mt-0.5`}
        />
        <input
          type="tel"
          value={data.clientInfo.phone}
          onChange={(e) => updateClient("phone", e.target.value)}
          placeholder="+1 555 000 0000"
          className={`${field} text-gray-500 text-xs block w-full max-w-[260px] mt-0.5`}
        />
        <input
          type="text"
          value={data.clientInfo.address}
          onChange={(e) => updateClient("address", e.target.value)}
          placeholder="Street address"
          className={`${field} text-gray-500 text-xs block w-full max-w-[260px] mt-0.5`}
        />
        <div className="flex gap-2 mt-0.5">
          <input
            type="text"
            value={data.clientInfo.city}
            onChange={(e) => updateClient("city", e.target.value)}
            placeholder="City"
            className={`${field} text-gray-500 text-xs w-24`}
          />
          <input
            type="text"
            value={data.clientInfo.country}
            onChange={(e) => updateClient("country", e.target.value)}
            placeholder="Country"
            className={`${field} text-gray-500 text-xs w-24`}
          />
        </div>
      </div>

      {/* ── Line Items ─────────────────────────────────────────── */}
      <div className="p-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left px-2 py-1.5 rounded-l font-semibold">Description</th>
              <th className="text-right px-2 py-1.5 font-semibold w-12">Qty</th>
              <th className="text-right px-2 py-1.5 font-semibold w-20">Unit Price</th>
              <th className="text-right px-2 py-1.5 rounded-r font-semibold w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-300">
                  No items yet
                </td>
              </tr>
            ) : (
              data.lineItems.map((item, i) => (
                <tr
                  key={item.id}
                  className={`group ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {/* Description */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Item description"
                      className={`${field} text-gray-700 w-full`}
                    />
                  </td>

                  {/* Qty */}
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className={`${field} text-gray-600 text-right w-full`}
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <span className="text-gray-400">{sym}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className={`${field} text-gray-600 text-right w-14`}
                      />
                    </div>
                  </td>

                  {/* Total + delete */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium text-gray-800">
                        {sym}{item.total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-0.5 shrink-0"
                        title="Remove item"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Add item */}
        <button
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-52 space-y-1">
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Subtotal</span>
              <span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs items-center">
              <div className="flex items-center gap-1">
                <span>Tax</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={data.taxRate}
                  onChange={(e) => onChange({ taxRate: parseFloat(e.target.value) || 0 })}
                  className={`${field} text-gray-500 text-xs text-right w-8`}
                />
                <span>%</span>
              </div>
              <span>{sym}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-1.5 font-bold text-gray-900 text-sm">
              <span>Total</span>
              <span className="text-blue-600">
                {data.currency} {sym}{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes & Terms ──────────────────────────────────────── */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
          <textarea
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Thank you for your business. We look forward to working with you."
            rows={3}
            className={`${field} text-xs text-gray-600 leading-relaxed w-full resize-none`}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Terms</p>
          <textarea
            value={data.terms}
            onChange={(e) => onChange({ terms: e.target.value })}
            placeholder="Payment due within 30 days of proposal acceptance."
            rows={3}
            className={`${field} text-xs text-gray-600 leading-relaxed w-full resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
