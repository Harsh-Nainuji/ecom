import { Truck, MapPin } from 'lucide-react';
import { listDeliveries, listDeliveryPartners } from '../../lib/actions';
import { DeliveryPartnersManager } from './DeliveryPartnersManager';
import { DeliveryAssignmentSelect } from './DeliveryAssignmentSelect';

export const revalidate = 30;

export const metadata = {
  title: 'Deliveries · FabZone Admin',
};

const deliveryStatusBadge: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  unassigned: 'bg-slate-50 text-slate-600 border-slate-200',
  assigned: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  out_for_delivery: 'bg-purple-50 text-purple-600 border-purple-100',
  failed: 'bg-rose-50 text-rose-600 border-rose-100',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export default async function DeliveriesPage() {
  const [deliveries, partners] = await Promise.all([listDeliveries(), listDeliveryPartners()]);

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Logistics</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Delivery Network</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <Truck className="h-4 w-4 text-[#c2185b]" />
          {deliveries.length} shipments
        </div>
      </div>

      <DeliveryPartnersManager initialPartners={partners} />

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {deliveries.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No active delivery assignments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F7E4E6] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Order ID</th>
                  <th className="pb-3.5">Assigned Agent</th>
                  <th className="pb-3.5">Destination Address</th>
                  <th className="pb-3.5">Order Status</th>
                  <th className="pb-3.5 text-right pr-2">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E4E6]/60">
                {deliveries.map((delivery: any) => {
                  const addr = delivery.address as any;
                  const destination = addr 
                    ? `${addr.recipient_name || addr.name || 'Recipient'}, ${addr.city || ''} (${addr.postal_code || ''})`
                    : 'No address provided';

                  return (
                    <tr key={delivery.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 pl-2 font-mono text-[10px] text-slate-400">
                        #{delivery.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4">
                        <DeliveryAssignmentSelect
                          orderId={delivery.id}
                          currentPartnerId={delivery.deliveryPartnerId}
                          partners={partners}
                        />
                      </td>
                      <td className="py-4 text-slate-500 font-medium max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#c2185b] flex-shrink-0" />
                          <span className="truncate">{destination}</span>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-slate-600 capitalize">
                        {delivery.orderStatus.replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${deliveryStatusBadge[delivery.deliveryStatus] ?? deliveryStatusBadge.pending}`}>
                          {delivery.deliveryStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
