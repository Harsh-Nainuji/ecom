'use client';

import { useState, useRef, useTransition } from 'react';
import { Plus, Trash2, Lock, Unlock, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { createDeliveryPartner, blockDeliveryPartner, deleteDeliveryPartner } from '../../lib/actions';

export interface DeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  code: string;
  vehicleDetails: string;
  status: string;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  isBlocked: boolean;
  createdAt: string;
}

export function DeliveryPartnersManager({ initialPartners }: { initialPartners: DeliveryPartner[] }) {
  const [partners, setPartners] = useState(initialPartners);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string; code: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    setCredentials(null);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const vehicleDetails = String(formData.get('vehicleDetails') ?? '').trim();

    if (!fullName || !email || !phone) {
      setError('Full name, email, and phone are required.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDeliveryPartner({ fullName, email, phone, vehicleDetails: vehicleDetails || undefined });
        setCredentials(result);
        formRef.current?.reset();
        window.location.reload();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleBlock(id: string, block: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await blockDeliveryPartner(id, block);
        setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, isBlocked: block } : p)));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleStatusUpdate(id: string, status: 'approved' | 'rejected' | 'suspended') {
    setError(null);
    startTransition(async () => {
      try {
        const { updateDeliveryPartnerStatus } = await import('../../lib/actions');
        await updateDeliveryPartnerStatus(id, status);
        setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, accountStatus: status } : p)));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this delivery partner account? This cannot be undone.')) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteDeliveryPartner(id);
        setPartners((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function copyCredentials() {
    if (!credentials) return;
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.tempPassword}\nCode: ${credentials.code}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        <h3 className="text-sm font-bold text-[#1A1A2D]">Create delivery partner account</h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Admin-created accounts get a temporary password shown once. Partners can also self-register from the app.
        </p>
        <form ref={formRef} action={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input name="fullName" type="text" placeholder="Ravi Kumar" className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</label>
            <input name="email" type="email" placeholder="ravi@example.com" className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
            <input name="phone" type="tel" placeholder="+91 90000 00000" className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle Details (optional)</label>
            <input name="vehicleDetails" type="text" placeholder="Bike - MH12AB1234" className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="glow-btn inline-flex items-center gap-2 rounded-xl bg-[#c2185b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#a01046] disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> {pending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
          {error && (
            <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
        </form>

        {credentials && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Account created! Share these credentials with the partner (shown once):</p>
                <p className="mt-1 font-mono">Email: {credentials.email}</p>
                <p className="font-mono">Password: {credentials.tempPassword}</p>
                <p className="font-mono">Partner Code: {credentials.code}</p>
              </div>
            </div>
            <button onClick={copyCredentials} className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        <h3 className="text-sm font-bold text-[#1A1A2D]">All delivery partners</h3>
        {partners.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No delivery partners yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F7E4E6] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Code</th>
                  <th className="pb-3.5">Name</th>
                  <th className="pb-3.5">Phone</th>
                  <th className="pb-3.5">Vehicle</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E4E6]/60">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 pl-2 font-mono text-[10px] text-slate-500">{partner.code}</td>
                    <td className="py-3 font-bold text-[#1A1A2D]">{partner.fullName}</td>
                    <td className="py-3 text-slate-500">{partner.phone}</td>
                    <td className="py-3 text-slate-500">{partner.vehicleDetails}</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase w-fit ${
                            partner.isBlocked
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {partner.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase w-fit ${
                            partner.accountStatus === 'pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : partner.accountStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {partner.accountStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex justify-end gap-2">
                        {partner.accountStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(partner.id, 'approved')}
                              disabled={pending}
                              className="glow-btn inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(partner.id, 'rejected')}
                              disabled={pending}
                              className="glow-btn inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleBlock(partner.id, !partner.isBlocked)}
                          disabled={pending}
                          className="glow-btn inline-flex items-center gap-1 rounded-lg border border-[#F7E4E6] bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                          {partner.isBlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {partner.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => handleDelete(partner.id)}
                          disabled={pending}
                          className="glow-btn inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
