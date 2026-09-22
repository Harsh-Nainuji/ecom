"use client";

import React, { useState } from 'react';
import { Eye, ShieldCheck, ShieldX, User } from 'lucide-react';
import { toggleUserBlock } from '../../lib/actions';

export default function BuyersClient({ buyers }: { buyers: any[] }) {
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);

  return (
    <div>
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {buyers.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No registered buyers found.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {buyers.map((buyer: any) => (
              <div key={buyer.id} className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1A1A2D]">{buyer.fullName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Phone: <span className="font-semibold text-slate-800">{buyer.phone}</span> · {buyer.orderCount} order{buyer.orderCount !== 1 ? 's' : ''} · Joined {new Date(buyer.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedBuyer(buyer)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold px-3 py-1.5 hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-pink-400" />
                    View Buyer Profile
                  </button>

                  {buyer.isBlocked ? (
                    <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase text-rose-600">
                      Blocked
                    </span>
                  ) : (
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase text-emerald-600">
                      Active
                    </span>
                  )}
                  <form action={toggleUserBlock.bind(null, buyer.id, !buyer.isBlocked)}>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition ${
                        buyer.isBlocked
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {buyer.isBlocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                      {buyer.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buyer Details Popup Modal */}
      {selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-[#c2185b]" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBuyer.fullName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Registered Buyer Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBuyer(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Credentials & Contact</p>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-bold text-slate-900">{selectedBuyer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registered Email:</span>
                  <span className="font-bold text-indigo-600 font-mono">{selectedBuyer.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mobile Number:</span>
                  <span className="font-bold text-slate-900">{selectedBuyer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registration Date:</span>
                  <span className="font-bold text-slate-900">{new Date(selectedBuyer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>


              <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Order Activity</p>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Total Orders Placed:</span>
                  <span className="font-black text-indigo-900">{selectedBuyer.orderCount} orders</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Account Status:</span>
                  <span className={`font-extrabold uppercase px-2 py-0.5 rounded text-[9px] ${selectedBuyer.isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selectedBuyer.isBlocked ? 'Blocked' : 'Active & Verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBuyer(null)}
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
