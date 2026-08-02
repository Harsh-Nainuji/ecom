"use client";

import React, { useState, useEffect } from 'react';
import { Percent, TrendingUp, Calendar, Plus, Sparkles, Check } from 'lucide-react';
import { getCommissionPercent, updateCommissionPercent, getSponsoredListings, createSponsoredListing, listProducts } from '../../lib/actions';

export default function RevenuePage() {
  const [commission, setCommission] = useState<number>(5.00);
  const [newCommission, setNewCommission] = useState<string>('5.00');
  const [sponsoredListings, setSponsoredListings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('Silver - 7 Days');
  const [selectedDays, setSelectedDays] = useState<number>(7);
  
  // Calculator states
  const [projectedSales, setProjectedSales] = useState<number>(100000);

  const [loading, setLoading] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      const [comm, listings, prod] = await Promise.all([
        getCommissionPercent(),
        getSponsoredListings(),
        listProducts()
      ]);
      setCommission(comm);
      setNewCommission(comm.toFixed(2));
      setSponsoredListings(listings);
      setProducts(prod.filter((p: any) => p.status === 'active'));
      if (prod.filter((p: any) => p.status === 'active').length > 0) {
        setSelectedProductId(prod.filter((p: any) => p.status === 'active')[0].id);
      }
    } catch (error) {
      console.error('Failed to load revenue data', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newCommission);
    if (isNaN(val) || val < 0 || val > 100) {
      alert("Please enter a valid percentage between 0 and 100.");
      return;
    }
    setSavingCommission(true);
    try {
      await updateCommissionPercent(val);
      setCommission(val);
      setSuccessMsg("Commission rate updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert("Failed to update: " + (err as Error).message);
    } finally {
      setSavingCommission(false);
    }
  };

  const handleCreateSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert("Please select a product.");
      return;
    }
    setSavingSponsor(true);
    try {
      await createSponsoredListing(selectedProductId, selectedPackage, selectedDays);
      await loadData();
      alert("Sponsorship activated successfully!");
    } catch (err) {
      alert("Failed to create sponsorship: " + (err as Error).message);
    } finally {
      setSavingSponsor(false);
    }
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pkg = e.target.value;
    setSelectedPackage(pkg);
    if (pkg.includes("3 Days")) {
      setSelectedDays(3);
    } else if (pkg.includes("7 Days")) {
      setSelectedDays(7);
    } else {
      setSelectedDays(30);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const estimatedCommissionRevenue = (projectedSales * commission) / 100;

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance & Growth</p>
        <h2 className="text-3xl font-semibold text-slate-900">Revenue</h2>
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
            
            <div className="my-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">
                  {commission === 0 ? 'Slab-Based' : `${commission}%`}
                </span>
                <span className="text-sm font-semibold text-slate-400">active rule</span>
              </div>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                {commission === 0 
                  ? 'Tiered Commission Slabs: 15% cut on items below ₹1,000; 10% on items above ₹1,000 to ₹10,000; 5% on items above ₹10,000.'
                  : 'Universal Flat Rate: This percentage will be charged flat on all sales.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                * To activate Tiered Slabs, update the commission rate below to exactly 0.00%
              </p>
            </div>

            <form onSubmit={handleUpdateCommission} className="flex gap-2">
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
    </div>
  );
}
