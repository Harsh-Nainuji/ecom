"use client";

import React, { useState, useEffect } from 'react';
import { Percent, TrendingUp, Calendar, Plus, Sparkles, Check, Trash2, Truck } from 'lucide-react';
import {
  getCommissionSettings,
  updateCommissionPercent,
  updateCommissionMode,
  listCommissionSlabs,
  createCommissionSlab,
  deleteCommissionSlab,
  getSponsoredListings,
  createSponsoredListing,
  listProducts,
  getAdminPayoutStats,
  listPendingPayouts,
  markPayoutAsPaid,
  markSellerPayoutsAsPaid,
  uploadPayoutProof
} from '../../lib/actions';


export default function RevenuePage() {
  const [commission, setCommission] = useState<number>(5.00);
  const [newCommission, setNewCommission] = useState<string>('5.00');
  const [commissionMode, setCommissionMode] = useState<'flat' | 'tiered'>('flat');
  const [slabs, setSlabs] = useState<any[]>([]);
  const [sponsoredListings, setSponsoredListings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [payoutStats, setPayoutStats] = useState<{
    onlineTotal: number;
    codTotal: number;
    totalCommission?: number;
    pendingPayoutsTotal?: number;
    paidPayoutsTotal?: number;
  }>({ onlineTotal: 0, codTotal: 0, totalCommission: 0, pendingPayoutsTotal: 0, paidPayoutsTotal: 0 });
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('Silver - 7 Days');
  const [selectedDays, setSelectedDays] = useState<number>(7);
  
  // Slab Form states
  const [slabMin, setSlabMin] = useState<string>('');
  const [slabMax, setSlabMax] = useState<string>('');
  const [slabPercent, setSlabPercent] = useState<string>('');
  
  // Calculator states
  const [projectedSales, setProjectedSales] = useState<number>(100000);

  const [loading, setLoading] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      const [settings, listings, prod, slabData, stats, payouts] = await Promise.all([
        getCommissionSettings(),
        getSponsoredListings(),
        listProducts(),
        listCommissionSlabs(),
        getAdminPayoutStats(),
        listPendingPayouts(),
      ]);
      setCommission(settings.commission_percent);
      setNewCommission(settings.commission_percent.toFixed(2));
      setCommissionMode(settings.commission_mode);
      setSponsoredListings(listings);
      setSlabs(slabData);
      setProducts(prod.filter((p: any) => p.status === 'active'));
      if (prod.filter((p: any) => p.status === 'active').length > 0) {
        setSelectedProductId(prod.filter((p: any) => p.status === 'active')[0].id);
      }
      setPayoutStats(stats);
      setPendingPayouts(payouts);
    } catch (error) {
      console.error('Failed to load revenue data', error);
    } finally {
      setLoading(false);
    }
  }

  const [payoutModal, setPayoutModal] = useState<{
    type: 'single' | 'seller';
    payoutId?: string;
    sellerId?: string;
    sellerName?: string;
  } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleOpenPayoutModal = (type: 'single' | 'seller', id: string, name?: string) => {
    setProofFile(null);
    if (type === 'single') {
      setPayoutModal({ type: 'single', payoutId: id });
    } else {
      setPayoutModal({ type: 'seller', sellerId: id, sellerName: name });
    }
  };

  const handleConfirmPayoutModal = async () => {
    if (!payoutModal) return;
    setUploadingProof(true);
    try {
      let proofUrl: string | undefined = undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        proofUrl = await uploadPayoutProof(formData);
      }
      if (payoutModal.type === 'single' && payoutModal.payoutId) {
        await markPayoutAsPaid(payoutModal.payoutId, proofUrl);
      } else if (payoutModal.type === 'seller' && payoutModal.sellerId) {
        await markSellerPayoutsAsPaid(payoutModal.sellerId, proofUrl);
      }
      setPayoutModal(null);
      await loadData();
      alert('Payout successfully marked as PAID! Seller dashboard has been updated.');
    } catch (err: any) {
      alert('Failed to mark payout: ' + err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newCommission);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    setSavingCommission(true);
    setSuccessMsg(null);
    try {
      await updateCommissionPercent(val);
      setCommission(val);
      setSuccessMsg('Commission rate updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to update commission: ' + (err as Error).message);
    } finally {
      setSavingCommission(false);
    }
  };

  const handleToggleMode = async (mode: 'flat' | 'tiered') => {
    setCommissionMode(mode);
    try {
      await updateCommissionMode(mode);
      await loadData();
    } catch (err) {
      alert('Failed to toggle mode: ' + (err as Error).message);
    }
  };


  const handleAddSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(slabMin);
    const max = slabMax ? parseFloat(slabMax) : null;
    const percent = parseFloat(slabPercent);

    if (isNaN(min) || (max !== null && isNaN(max)) || isNaN(percent)) {
      alert('Please enter valid numerical values.');
      return;
    }
    if (max !== null && max <= min) {
      alert('Max Price must be strictly greater than Min Price.');
      return;
    }

    try {
      await createCommissionSlab(min, max, percent);
      setSlabMin('');
      setSlabMax('');
      setSlabPercent('');
      await loadData();
    } catch (err) {
      alert('Failed to add slab: ' + (err as Error).message);
    }
  };

  const handleDeleteSlab = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slab?')) return;
    try {
      await deleteCommissionSlab(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete slab: ' + (err as Error).message);
    }
  };

  const handleCreateSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    setSavingSponsor(true);
    try {
      await createSponsoredListing(selectedProductId, selectedPackage, selectedDays);
      await loadData();
      alert('Sponsorship activated successfully!');
    } catch (err) {
      alert('Failed to create sponsorship: ' + (err as Error).message);
    } finally {
      setSavingSponsor(false);
    }
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pkg = e.target.value;
    setSelectedPackage(pkg);
    if (pkg.includes('3 Days')) {
      setSelectedDays(3);
    } else if (pkg.includes('7 Days')) {
      setSelectedDays(7);
    } else {
      setSelectedDays(30);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  const estimatedCommissionRevenue = (projectedSales * commission) / 100;

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance & Growth</p>
          <h2 className="text-3xl font-semibold text-slate-900">Revenue & Seller Payouts</h2>
        </div>
      </div>

      {/* Payout Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Razorpay Gateway Inflow</p>
          <p className="text-2xl font-black text-[#1A1A2D] mt-1">₹{payoutStats.onlineTotal.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">100% in Admin Bank Account</span>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Platform Profit</p>
          <p className="text-2xl font-black text-[#c2185b] mt-1">₹{(payoutStats.totalCommission ?? 0).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 font-medium">Earned platform commission</span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Seller Transfers</p>
          <p className="text-2xl font-black text-amber-700 mt-1">₹{(payoutStats.pendingPayoutsTotal ?? 0).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-amber-600 font-semibold">{pendingPayouts.length} transfers to be sent</span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Settled to Sellers</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{(payoutStats.paidPayoutsTotal ?? 0).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Confirmed bank transfers</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Commission Settings Card */}
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Settings</p>
                <h3 className="text-xl font-semibold text-slate-900">Platform Commission</h3>
              </div>
              <div className="rounded-full bg-slate-900 p-2 text-white">
                <Percent className="h-5 w-5" />
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl mt-6 mb-4">
              <button
                type="button"
                onClick={() => handleToggleMode('flat')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${commissionMode === 'flat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Universal Flat Rate
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('tiered')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${commissionMode === 'tiered' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Tiered Slabs
              </button>
            </div>
            
            {commissionMode === 'flat' ? (
              <div className="my-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-900">
                    {commission}%
                  </span>
                  <span className="text-sm font-semibold text-slate-400">active flat rate</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  Universal Flat Rate: This percentage will be charged flat on all sales.
                </p>

                <form onSubmit={handleUpdateCommission} className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-900"
                      value={newCommission}
                      onChange={(e) => setNewCommission(e.target.value)}
                      placeholder="E.g. 5.00"
                      required
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-semibold">%</span>
                  </div>
                  <button
                    type="submit"
                    disabled={savingCommission}
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {savingCommission ? 'Saving...' : 'Update'}
                  </button>
                </form>
                {successMsg && (
                  <p className="text-emerald-600 text-xs mt-2 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> {successMsg}
                  </p>
                )}
              </div>
            ) : (
              <div className="my-6 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900">Active Tiered Slabs</span>
                  <span className="text-xs font-semibold text-slate-400">({slabs.length} configured)</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="p-3">Min Price</th>
                        <th className="p-3">Max Price</th>
                        <th className="p-3">Percent</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {slabs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No slabs defined yet. Add one below.</td>
                        </tr>
                      ) : (
                        slabs.map((slab) => (
                          <tr key={slab.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">₹{Number(slab.min_price).toLocaleString('en-IN')}</td>
                            <td className="p-3 font-semibold text-slate-700">
                              {slab.max_price !== null ? `₹${Number(slab.max_price).toLocaleString('en-IN')}` : 'No limit (∞)'}
                            </td>
                            <td className="p-3 font-bold text-slate-900">{slab.percent}%</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSlab(slab.id)}
                                className="text-rose-600 hover:text-rose-700 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Slab Form */}
                <form onSubmit={handleAddSlab} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Slab</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Min (₹)"
                        value={slabMin}
                        onChange={(e) => setSlabMin(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max (₹)"
                        value={slabMax}
                        onChange={(e) => setSlabMax(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Percent (%)"
                        value={slabPercent}
                        onChange={(e) => setSlabPercent(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    Add Slab
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Revenue Estimator
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Projected Monthly GMV</span>
                  <span>₹{projectedSales.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="10000"
                  value={projectedSales}
                  onChange={(e) => setProjectedSales(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-slate-50 p-4">
                <span className="text-xs font-semibold text-slate-500">Estimated Monthly Commission</span>
                <span className="text-lg font-bold text-emerald-600">₹{estimatedCommissionRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor Products Card */}
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Marketing</p>
              <h3 className="text-xl font-semibold text-slate-900">Sponsor Product</h3>
            </div>
            <div className="rounded-full bg-slate-900 p-2 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <form onSubmit={handleCreateSponsorship} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Select Active Product
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-900 bg-white"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                {products.length === 0 ? (
                  <option value="">No active products available</option>
                ) : (
                  products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price} · {p.sellerName})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sponsorship Package
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-900 bg-white"
                  value={selectedPackage}
                  onChange={handlePackageChange}
                  required
                >
                  <option value="Bronze - 3 Days">Bronze (3 Days)</option>
                  <option value="Silver - 7 Days">Silver (7 Days)</option>
                  <option value="Gold - 30 Days">Gold (30 Days)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingSponsor || products.length === 0}
                  className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Sponsor Product
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Active Sponsored Listings
            </h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {sponsoredListings.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No sponsored listings active.</p>
              ) : (
                sponsoredListings.map((listing: any) => {
                  const daysLeft = Math.ceil((new Date(listing.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isActive = daysLeft > 0;
                  return (
                    <div key={listing.id} className="rounded-2xl border border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{listing.productName}</p>
                        <p className="text-xs text-slate-500">
                          Seller: {listing.sellerName} · Package: {listing.packageName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Ends: {new Date(listing.endsAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                        {isActive ? `${daysLeft}d left` : 'Expired'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payouts Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Operations</p>
            <h3 className="text-xl font-semibold text-slate-900">Pending Seller Payouts</h3>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full">
            {pendingPayouts.length} Payouts Pending
          </span>
        </div>

        {pendingPayouts.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">All seller payouts are up to date. No pending payouts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Seller & Bank Account</th>
                  <th className="pb-3.5">Order Info</th>
                  <th className="pb-3.5">Order Breakdown</th>
                  <th className="pb-3.5">Net Payout Due</th>
                  <th className="pb-3.5">Order Date</th>
                  <th className="pb-3.5 text-right pr-2">Checklist Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 pl-2">
                      <p className="font-bold text-slate-900">{payout.sellerName}</p>
                      <div className="mt-1 flex flex-col text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xs">
                        <span>A/C: <strong className="text-slate-800">{payout.bankAccount}</strong></span>
                        <span>IFSC: <strong className="text-slate-800">{payout.bankIfsc}</strong></span>
                        <span>Name: <strong className="text-slate-800">{payout.bankName}</strong></span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        #{payout.orderId.slice(0, 8).toUpperCase()}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 capitalize">{payout.paymentMethod} Payment</p>
                    </td>
                    <td className="py-4 text-slate-600">
                      <p className="font-semibold text-slate-800">Subtotal: ₹{payout.subtotalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-rose-600 font-medium">- Fee ({((payout.commissionAmount / (payout.subtotalAmount || 1)) * 100).toFixed(1)}%): ₹{payout.commissionAmount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-4 font-black text-lg text-emerald-700">
                      ₹{payout.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-slate-500 font-medium text-[11px]">
                      {payout.orderPlacedAt ? new Date(payout.orderPlacedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '—'}
                    </td>
                    <td className="py-4 text-right pr-2 space-y-1">
                      <button
                        onClick={() => handleOpenPayoutModal('single', payout.id)}
                        disabled={uploadingProof}
                        className="w-full inline-flex justify-center rounded-lg bg-emerald-600 text-white font-bold px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm text-xs"
                      >
                        ✓ Mark Transferred
                      </button>
                      <button
                        onClick={() => handleOpenPayoutModal('seller', payout.sellerId, payout.sellerName)}
                        disabled={uploadingProof}
                        className="w-full inline-flex justify-center rounded-lg bg-slate-900 text-white font-bold px-3 py-1 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm text-[10px]"
                      >
                        Pay All for Seller
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>

      {/* Payout Modal */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {payoutModal.type === 'single' ? 'Mark Payout as Paid' : `Mark All Paid for ${payoutModal.sellerName}`}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              You can optionally upload a payment transaction screenshot / receipt copy as proof for the seller.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Upload Payment Proof Screenshot (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPayoutModal(null)}
                  disabled={uploadingProof}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayoutModal}
                  disabled={uploadingProof}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploadingProof ? 'Processing...' : 'Confirm & Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

