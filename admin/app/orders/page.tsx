import { Truck, Coins } from 'lucide-react';
import { listOrders } from '../../lib/actions';

export const revalidate = 30; // revalidate at most every 30 seconds

export const metadata = {
  title: 'Orders · FabZone Admin',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-[#a0522d] border-[#F2E5D5]',
  paid: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  packed: 'bg-sky-50 text-sky-600 border-sky-100',
  shipped: 'bg-blue-50 text-blue-600 border-blue-100',
  out_for_delivery: 'bg-purple-50 text-purple-600 border-purple-100',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
};

const paymentBadge: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  failed: 'bg-rose-50 text-rose-600 border-rose-200',
  refunded: 'bg-amber-50 text-amber-600 border-amber-200',
};

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Transactions</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Customer Orders</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <Truck className="h-4 w-4 text-[#c2185b]" />
          {orders.length} orders
        </div>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No orders placed in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F7E4E6] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Order ID</th>
                  <th className="pb-3.5">Placed At</th>
                  <th className="pb-3.5">Buyer</th>
                  <th className="pb-3.5">Seller</th>
                  <th className="pb-3.5">Amount</th>
                  <th className="pb-3.5 text-center">Payment</th>
                  <th className="pb-3.5 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E4E6]/60">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 pl-2 font-mono text-[10px] text-slate-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {new Date(order.placedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-4 font-bold text-[#1A1A2D]">{order.buyerName}</td>
                    <td className="py-4 font-semibold text-slate-600">{order.sellerName}</td>
                    <td className="py-4 font-black text-[#1A1A2D]">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${paymentBadge[order.paymentStatus] ?? paymentBadge.pending}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusBadge[order.status] ?? statusBadge.pending}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
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
