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
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Accounts</p>
          <h2 className="text-3xl font-semibold text-slate-900">Buyers</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <Users className="h-4 w-4" />
          {buyers.length} total
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        {buyers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No buyers yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {buyers.map((buyer) => (
              <div key={buyer.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{buyer.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {buyer.phone} · {buyer.orderCount} orders · joined {new Date(buyer.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {buyer.isBlocked ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Blocked
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      Active
                    </span>
                  )}
                  <form action={toggleUserBlock.bind(null, buyer.id, !buyer.isBlocked)}>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
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
