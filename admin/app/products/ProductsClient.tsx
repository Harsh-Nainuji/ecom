"use client";

import React, { useState } from 'react';
import { Eye, Package, Trash2, ShieldCheck, Tag, Globe } from 'lucide-react';
import { deleteProduct } from '../../lib/actions';

const statusBadge: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  inactive: 'bg-amber-50 text-amber-600 border-amber-200',
};

export default function ProductsClient({ products }: { products: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  return (
    <div>
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {products.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No products listed in catalog.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {products.map((product: any) => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-4.5 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1A1A2D]">{product.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Seller: <span className="font-semibold text-slate-800">{product.sellerName}</span> · Price: <span className="font-bold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span> · Images: {product.imageCount}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    Added {new Date(product.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold px-3 py-1.5 hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-pink-400" />
                    View Specs & Compliance
                  </button>

                  <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusBadge[product.status] ?? statusBadge.draft}`}>
                    {product.status}
                  </span>

                  <form action={deleteProduct.bind(null, product.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-rose-750 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Compliance Popup Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-[#c2185b]" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Indian Legal Compliance Specs</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pricing & Commercials</p>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Selling Price:</span>
                  <span className="font-black text-slate-900 text-sm">₹{selectedProduct.price.toLocaleString('en-IN')} (Incl. Taxes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Seller Partner:</span>
                  <span className="font-bold text-slate-900">{selectedProduct.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Product Images:</span>
                  <span className="font-bold text-slate-900">{selectedProduct.imageCount} high-res images</span>
                </div>
              </div>

              <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Indian E-Commerce Legal Disclosures</p>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Country of Origin:</span>
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-purple-600" /> India (Mandatory Disclosure)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">HSN / SAC Code:</span>
                  <span className="font-mono font-bold text-purple-900">6204 / 6206 (Textiles)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">GST Tax Structure:</span>
                  <span className="font-bold text-slate-900">5% Tax Bracket</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Listing Status:</span>
                  <span className={`font-extrabold uppercase px-2 py-0.5 rounded text-[9px] ${statusBadge[selectedProduct.status]}`}>
                    {selectedProduct.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl bg-slate-900 text-white font-bold px-5 py-2 text-xs hover:bg-slate-800"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
