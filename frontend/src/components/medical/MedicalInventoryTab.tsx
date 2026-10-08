"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { InventoryItem } from "./types";

export interface MedicalInventoryTabProps {
  inventory: InventoryItem[];
  filteredInventory: InventoryItem[];
  inventoryCatFilter: string;
  setInventoryCatFilter: (val: string) => void;
  lowStockCount: number;
  onRestock: (id: string) => void;
}

export function MedicalInventoryTab({
  inventory,
  filteredInventory,
  inventoryCatFilter,
  setInventoryCatFilter,
  lowStockCount,
  onRestock,
}: MedicalInventoryTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Essential Drug &amp; Supplies Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Jan Aushadhi Kendra dispensary stock register with batch tracking, expiry monitoring, threshold alerts, and depot replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-2">
            <span className="text-slate-400">Total Formulations:</span>
            <span className="text-teal-800 font-extrabold">{inventory.length}</span>
          </div>
          {lowStockCount > 0 && (
            <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shadow-2xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{lowStockCount} Low Stock</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Dispensary Stock &amp; Batch Register
            </h2>
            <p className="text-xs text-slate-500">
              Jan Aushadhi Kendra dispensary stock register with batch tracking and threshold monitoring.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "LOW", "ANTIBIOTIC", "ANALGESIC", "CARDIOVASCULAR", "ANTIDIABETIC"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setInventoryCatFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  inventoryCatFilter === cat
                    ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat === "LOW" ? "⚠️ Low Stock" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Drug Code</th>
                  <th className="py-3 px-4">Generic Formulation</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Batch / Expiry</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{item.drugCode}</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 block text-xs">{item.genericName}</span>
                      <span className="text-[10px] text-slate-400">{item.brandName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                      {item.batchNumber} • {item.expiryDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-black text-sm ${item.currentStock < item.threshold ? "text-rose-700" : "text-slate-900"}`}>
                        {item.currentStock}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRestock(item.id)}
                        className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        + Restock 500
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
