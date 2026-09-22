"use client";

import React, { useState } from 'react';
import { Ban, CheckCircle2, Clock, Eye, ShieldCheck, ShoppingBag, XCircle, Building2, CreditCard, FileText } from 'lucide-react';
import { approveSeller, rejectSeller, suspendSeller, toggleUserBlock } from '../../lib/actions';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-600 border-rose-200',
  suspended: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function SellersClient({ sellers }: { sellers: any[] }) {
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);

  return (
    <div>
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {sellers.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No sellers registered.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {sellers.map((seller: any) => (
              <div key={seller.id} className="flex flex-col gap-3 py-5 transition-colors hover:bg-slate-50/20 px-2 rounded-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-[#1A1A2D]">{seller.businessName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Owner: <span className="font-semibold text-slate-800">{seller.fullName}</span> · GST: <span className="font-mono font-bold text-slate-900">{seller.gst}</span> · Phone: {seller.mobile}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      {seller.productCount} products · Joined {new Date(seller.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    {seller.rejectedReason ? (
                      <p className="mt-1 text-xs font-semibold text-rose-500">Reason: {seller.rejectedReason}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setSelectedSeller(seller)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold px-3 py-1.5 hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-pink-400" />
                      View Full Details
                    </button>

                    <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusBadge[seller.status] ?? statusBadge.pending}`}>
                      {seller.status}
                    </span>
                    {seller.isBlocked ? (
                      <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase text-rose-600">
                        Blocked
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                  {seller.status !== 'approved' && (
                    <form action={approveSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                  )}
                  {seller.status !== 'rejected' && (
                    <form action={rejectSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-rose-700 transition hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  )}
                  {seller.status !== 'suspended' && (
                    <form action={suspendSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-250 bg-slate-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-slate-700 transition hover:bg-slate-100"
                      >
                        <Clock className="h-3.5 w-3.5" /> Suspend
                      </button>
                    </form>
                  )}
                  <form action={toggleUserBlock.bind(null, seller.id, !seller.isBlocked)}>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition ${
                        seller.isBlocked
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {seller.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seller Legal Details Popup Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#c2185b]" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedSeller.businessName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Seller Profile & Legal Compliance</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business & Owner Info</p>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Trade Name:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Name:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mobile Number:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.mobile || selectedSeller.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email Address:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.email}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">GSTIN & Legal Identification</p>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">GST Identification Number:</span>
                  <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">{selectedSeller.gst}</span>
                </div>
                {selectedSeller.pan && selectedSeller.pan !== '—' && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">PAN Number:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedSeller.pan}</span>
                  </div>
                )}
                {selectedSeller.address && selectedSeller.address !== '—' && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Registered Address:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">{selectedSeller.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">KYC Status:</span>
                  <span className={`font-extrabold uppercase px-2 py-0.5 rounded text-[9px] ${statusBadge[selectedSeller.status]}`}>
                    {selectedSeller.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Registration Date:</span>
                  <span className="font-bold text-slate-900">{new Date(selectedSeller.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Payout & Bank Account Info</p>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Account Name:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.bankName || selectedSeller.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Bank Account No:</span>
                  <span className="font-mono font-bold text-emerald-900">{selectedSeller.bankAccount || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedSeller.bankIfsc || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Active Catalog Products:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.productCount} items listed</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSeller(null)}
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
