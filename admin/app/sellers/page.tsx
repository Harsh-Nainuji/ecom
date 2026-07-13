import { Ban, CheckCircle2, Clock, ShoppingBag, XCircle } from 'lucide-react';
import { approveSeller, listSellers, rejectSeller, suspendSeller, toggleUserBlock } from '../../lib/actions';

export const metadata = {
  title: 'Sellers · FabZone Admin',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-600 border-rose-200',
  suspended: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default async function SellersPage() {
  const sellers = await listSellers();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Accounts</p>
          <h2 className="text-3xl font-semibold text-slate-900">Sellers</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <ShoppingBag className="h-4 w-4" />
          {sellers.length} total
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        {sellers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No sellers yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {sellers.map((seller) => (
              <div key={seller.id} className="flex flex-col gap-3 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{seller.businessName}</p>
                    <p className="text-xs text-slate-500">
                      {seller.fullName} · {seller.mobile} · {seller.email} · GST {seller.gst}
                    </p>
                    <p className="text-xs text-slate-400">
                      {seller.productCount} products · joined {new Date(seller.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    {seller.rejectedReason ? (
                      <p className="mt-1 text-xs text-rose-500">Reason: {seller.rejectedReason}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge[seller.status] ?? statusBadge.pending}`}>
                      {seller.status}
                    </span>
                    {seller.isBlocked ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                        Blocked
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {seller.status !== 'approved' && (
                    <form action={approveSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                  )}
                  {seller.status !== 'rejected' && (
                    <form action={rejectSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  )}
                  {seller.status !== 'suspended' && (
                    <form action={suspendSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Clock className="h-3.5 w-3.5" /> Suspend
                      </button>
                    </form>
                  )}
                  <form action={toggleUserBlock.bind(null, seller.id, !seller.isBlocked)}>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
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
    </div>
  );
}
