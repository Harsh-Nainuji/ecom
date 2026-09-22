import { Truck } from 'lucide-react';
import { listOrders } from '../../lib/actions';
import OrdersClient from './OrdersClient';

export const revalidate = 0; // Fresh order data on demand

export const metadata = {
  title: 'Orders · FabZone Admin',
};

export default async function OrdersPage(props: { searchParams: Promise<{ paymentMethod?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.paymentMethod;
  
  let orders = await listOrders();
  if (filter === 'cod') {
    orders = orders.filter((o: any) => o.paymentMethod === 'cod');
  } else if (filter === 'online') {
    orders = orders.filter((o: any) => o.paymentMethod === 'online' || !o.paymentMethod);
  }

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Transactions</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Customer Orders</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <a href="/orders" className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!filter ? 'bg-[#c2185b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>All</a>
            <a href="/orders?paymentMethod=online" className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === 'online' ? 'bg-[#c2185b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Online</a>
            <a href="/orders?paymentMethod=cod" className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filter === 'cod' ? 'bg-[#c2185b] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>COD</a>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
            <Truck className="h-4 w-4 text-[#c2185b]" />
            {orders.length} orders
          </div>
        </div>
      </div>

      <OrdersClient orders={orders} />
    </div>
  );
}
