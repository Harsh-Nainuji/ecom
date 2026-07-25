import { Ban, CheckCircle2, Clock, ShoppingBag, XCircle } from 'lucide-react';
import { approveSeller, listSellers, rejectSeller, suspendSeller, toggleUserBlock } from '../../lib/actions';

export const revalidate = 30;

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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Accounts</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Seller Partners</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <ShoppingBag className="h-4 w-4 text-[#c2185b]" />
          {sellers.length} total
        </div>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {sellers.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No sellers registered.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {sellers.map((seller: any) => (
              <div key={seller.id} className="flex flex-col gap-3 py-5 transition-colors hover:bg-slate-50/20 px-2 rounded-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1A1A2D]">{seller.businessName}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Owner: {seller.fullName} · Mobile: {seller.mobile} · Email: {seller.email} · GST: {seller.gst}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300 mt-1">
                      {seller.productCount} products · joined {new Date(seller.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    {seller.rejectedReason ? (
                      <p className="mt-1 text-[10px] font-semibold text-rose-500">Reason: {seller.rejectedReason}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2.5">
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
                        className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                  )}
                  {seller.status !== 'rejected' && (
                    <form action={rejectSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-rose-700 transition hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  )}
                  {seller.status !== 'suspended' && (
                    <form action={suspendSeller.bind(null, seller.id)}>
                      <button
                        type="submit"
                        className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-slate-250 bg-slate-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-slate-700 transition hover:bg-slate-100"
                      >
                        <Clock className="h-3.5 w-3.5" /> Suspend
                      </button>
                    </form>
                  )}
                  <form action={toggleUserBlock.bind(null, seller.id, !seller.isBlocked)}>
                    <button
                      type="submit"
                      className={`glow-btn inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition ${
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
