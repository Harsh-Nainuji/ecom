"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Landmark, CreditCard, ShieldCheck, Check } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../../lib/actions';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  async function loadData() {
    try {
      const data = await getSystemSettings();
      setRazorpayKeyId(data.razorpay_live_key_id);
      setRazorpayKeySecret(data.razorpay_live_key_secret);
      setBankAccountName(data.admin_bank_account_name);
      setBankAccountNumber(data.admin_bank_account_number);
      setBankIfsc(data.admin_bank_ifsc);
      setBankName(data.admin_bank_name);
    } catch (err) {
      console.error('Failed to load system settings', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings({
        razorpay_live_key_id: razorpayKeyId.trim(),
        razorpay_live_key_secret: razorpayKeySecret.trim(),
        admin_bank_account_name: bankAccountName.trim(),
        admin_bank_account_number: bankAccountNumber.trim(),
        admin_bank_ifsc: bankIfsc.trim().toUpperCase(),
        admin_bank_name: bankName.trim(),
      });
      setSuccessMsg('System settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-10 py-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">System Administration</p>
          <h2 className="text-3xl font-semibold text-slate-900">System & Gateway Settings</h2>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800">
          <Check className="h-5 w-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Admin Bank Details Card */}
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Payout Destination</p>
              <h3 className="text-xl font-semibold text-slate-900">Admin Official Bank Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                This bank account receives customer payments and is used to disburse seller payouts.
              </p>
            </div>
            <div className="rounded-full bg-slate-900 p-3 text-white">
              <Landmark className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="e.g. FabZone Private Limited"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 50100234567890"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                placeholder="e.g. HDFC0001234"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Razorpay Live Credentials Card */}
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Payment Gateway</p>
              <h3 className="text-xl font-semibold text-slate-900">Razorpay Production Credentials</h3>
              <p className="text-xs text-slate-500 mt-1">
                Used to initialize live buyer transactions and verify payment webhooks.
              </p>
            </div>
            <div className="rounded-full bg-rose-600 p-3 text-white">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Razorpay Live Key ID (`rzp_live_...`)
              </label>
              <input
                type="text"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Razorpay Live Key Secret
              </label>
              <input
                type="password"
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/60 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">Security & Encryption Notice</p>
              <p>
                Credentials saved here are protected using PostgreSQL Row-Level Security (RLS) restricted strictly to authorized platform administrators.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 shadow-md"
          >
            {saving ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
