import { ShieldCheck, ShieldX, Users } from 'lucide-react';
import { listBuyers, toggleUserBlock } from '../../lib/actions';

export const metadata = {
  title: 'Buyers · FabZone Admin',
};

export default async function BuyersPage() {
  const buyers = await listBuyers();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Accounts</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Buyer Registry</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <Users className="h-4 w-4 text-[#c2185b]" />
          {buyers.length} total
        </div>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {buyers.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No registered buyers found.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {buyers.map((buyer: any) => (
              <div key={buyer.id} className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#1A1A2D]">{buyer.fullName}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {buyer.phone} · {buyer.orderCount} order{buyer.orderCount !== 1 ? 's' : ''} · joined {new Date(buyer.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                      className={`glow-btn inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition ${
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
    </div>
  );
}
