"use client";

import { LineItem } from "../types/proposal";

interface Props {
  items: LineItem[];
  currencySymbol: string;
  onChange: (items: LineItem[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function LineItems({ items, currencySymbol, onChange }: Props) {
  const addItem = () => {
    const newItem: LineItem = {
      id: generateId(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total =
            (field === "quantity" ? Number(value) : item.quantity) *
            (field === "unitPrice" ? Number(value) : item.unitPrice);
        }
        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Line Items</h2>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-3 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 hover:bg-blue-50 transition-colors"
          >
            {/* Description */}
            <div className="col-span-12 sm:col-span-5">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                placeholder="Item description"
                className="w-full bg-transparent border-b border-transparent focus:border-blue-400 px-1 py-1 text-sm focus:outline-none"
              />
            </div>

            {/* Quantity */}
            <div className="col-span-4 sm:col-span-2">
              <label className="sm:hidden block text-xs text-gray-500 mb-0.5">Qty</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent border-b border-transparent focus:border-blue-400 px-1 py-1 text-sm text-right focus:outline-none"
              />
            </div>

            {/* Unit Price */}
            <div className="col-span-4 sm:col-span-3">
              <label className="sm:hidden block text-xs text-gray-500 mb-0.5">Unit Price</label>
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-gray-400">{currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-b border-transparent focus:border-blue-400 px-1 py-1 text-sm text-right focus:outline-none"
                />
              </div>
            </div>

            {/* Total */}
            <div className="col-span-3 sm:col-span-2 flex items-center justify-between gap-1">
              <span className="text-sm font-medium text-gray-700 text-right flex-1">
                {currencySymbol}{item.total.toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-1 shrink-0"
                title="Remove item"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          No items yet. Add your first line item below.
        </div>
      )}

      <button
        onClick={addItem}
        className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <div className="text-sm text-gray-500">
            Subtotal:{" "}
            <span className="font-semibold text-gray-900 ml-2">
              {currencySymbol}{subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
