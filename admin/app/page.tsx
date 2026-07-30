import {
  AlertOctagon,
  CheckCircle2,
  Clock3,
  CreditCard,
  Database,
  PackageSearch,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  formatCurrency,
  formatRelativeTime,
  getAdminDashboardStats,
  orderStatusLabel,
  orderStatusPillClass,
} from '../lib/api/adminStats';
import { getDatabaseUsage } from '../lib/actions';

export const revalidate = 30;

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default async function Home() {
  let stats;
  let usage;
  try {
    stats = await getAdminDashboardStats();
    usage = await getDatabaseUsage().catch(() => null);
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-10 py-20">
        <AlertOctagon className="h-10 w-10 text-rose-500" />
        <h2 className="text-xl font-semibold text-slate-900">Unable to load dashboard</h2>
        <p className="text-sm text-slate-500">{(error as Error).message}</p>
      </div>
    );
  }

  const escalations = stats.failedDeliveryCount + stats.cancelledOrderCount;
  const alerts = [
    ...(stats.lowStock.length ? [{ title: 'Inventory Risk', description: `${stats.lowStock.length} SKU${stats.lowStock.length > 1 ? 's' : ''} running low on stock.`, type: 'warning' as const }] : []),
    ...(stats.failedDeliveryCount ? [{ title: 'Delivery SLA Breach', description: `${stats.failedDeliveryCount} failed delivery attempt${stats.failedDeliveryCount > 1 ? 's' : ''}.`, type: 'error' as const }] : []),
    ...(stats.pendingSellerCount ? [{ title: 'Seller Docs Pending', description: `${stats.pendingSellerCount} application${stats.pendingSellerCount > 1 ? 's' : ''} awaiting review.`, type: 'info' as const }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-[28px] font-bold text-slate-900 editorial-header tracking-tight">Marketplace Pulse</h2>
          <p className="text-sm text-slate-500 mt-1">Realtime operations and system status center.</p>
        </div>
      </div>

      {/* Row 1: 4 Metric Cards (Real stats, no mock text or values) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* GMV Box */}
        <div className="rounded-[1.5rem] bg-[#c2185b] p-5 shadow-sm text-white flex flex-col justify-between h-[140px] relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent w-full h-full"></div>
          <div className="flex items-start justify-between relative z-10">
            <span className="text-sm font-medium opacity-90">Gross Merchandise Value</span>
            <TrendingUp className="h-4 w-4 opacity-85" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold tracking-tight mb-1">{formatCurrency(stats.gmv)}</div>
            <span className="text-[10px] opacity-80 font-medium">Lifetime order volume</span>
          </div>
        </div>

        {/* New Buyers */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-5 shadow-sm text-slate-900 flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-slate-700">New Buyers</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight mb-1 text-slate-800">{stats.newBuyerCount}</div>
            <span className="text-[10px] font-semibold text-slate-400">{stats.buyerCount} total buyers</span>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-5 shadow-sm text-slate-900 flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-slate-700">Pending Seller Payouts</span>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight mb-1 text-slate-800">{formatCurrency(stats.pendingPayoutTotal)}</div>
            <span className="text-[10px] font-semibold text-slate-400">{stats.pendingSellerCount} sellers pending</span>
          </div>
        </div>

        {/* Support Escalations */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-5 shadow-sm text-slate-900 flex flex-col justify-between h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-slate-700">Support Escalations</span>
            <AlertOctagon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight mb-1 text-slate-800">{escalations} Open</div>
            <span className="text-[10px] font-semibold text-slate-400">{stats.failedDeliveryCount} failed • {stats.cancelledOrderCount} cancelled</span>
          </div>
        </div>
      </div>

      {/* Row 2: Live Fulfillment Board & Database Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Live Fulfillment Board (Takes 8 cols) */}
        <div className="lg:col-span-8 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Fulfillment Board</h3>
              <p className="text-xs text-slate-500">Realtime order tracking feed</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#EBFDF5] px-3 py-1 text-[10px] font-bold text-emerald-600 border border-[#A7F3D0]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
            {stats.recentOrders.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">No recent orders found.</p>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex flex-wrap items-center gap-4 py-3.5 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                  <div className="w-24 font-mono text-[10px] font-semibold text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{order.buyer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} · {formatRelativeTime(order.placedAt)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-800">₹{order.amount.toLocaleString('en-IN')}</p>
                  <span className={['rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase', orderStatusPillClass(order.status)].join(' ')}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Database Progress (Takes 4 cols) */}
        <div className="lg:col-span-4 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-[390px] lg:h-auto">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Database Storage</h3>
            <p className="text-xs text-slate-500 mb-6">System space utilization</p>
          </div>
          {usage ? (
            <div className="flex flex-col items-center justify-center flex-1 mb-4">
              <div className="relative h-36 w-36 rounded-full border-[10px] border-slate-100 border-t-[#c2185b] border-r-[#c2185b] border-l-[#c2185b] rotate-45 flex items-center justify-center shadow-inner">
                <div className="-rotate-45 flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">{usage.usedPercent}%</span>
                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Used Capacity</span>
                </div>
              </div>
              <div className="text-center mt-6">
                <p className="text-xs font-bold text-slate-700">{formatBytes(usage.usedBytes)} used</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(usage.remainingBytes)} available</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400 flex-1 flex items-center justify-center">
              Unable to load usage data
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Seller Pipeline, Alerts, Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
        {/* Seller Pipeline */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Seller Pipeline</h3>
            <ShoppingBag className="h-4 w-4 text-[#c2185b]" />
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {stats.sellerPipeline.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No sellers in pipeline.</p>
            ) : (
              stats.sellerPipeline.map((seller: any) => (
                <div key={seller.id} className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{seller.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{seller.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="rounded-lg bg-pink-50 border border-pink-100 px-2 py-0.5 text-[9px] font-bold text-[#c2185b]">
                      {seller.skuCount} SKUs
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incident Alerts */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Incident Alerts</h3>
            <ShieldAlert className="h-4 w-4 text-[#c2185b]" />
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No critical alerts.</p>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.title} className="rounded-xl border border-slate-100 bg-slate-50/20 p-3">
                  <div className="flex items-start gap-2.5">
                    {alert.type === 'warning' && <Clock3 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />}
                    {alert.type === 'error' && <AlertOctagon className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />}
                    {alert.type === 'info' && <PackageSearch className="h-3.5 w-3.5 text-sky-600 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Approvals */}
        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Approvals (24h)</h3>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {[
              { title: 'Buyer Verifications', value: `${stats.approvals24h.buyer ?? 0} new registrants` },
              { title: 'Seller Registrations', value: `${stats.approvals24h.seller ?? 0} applications approved` },
              { title: 'Delivery Network', value: `${stats.approvals24h.delivery ?? 0} partners active` },
            ].map((item: any) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 bg-slate-50/10">
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.value}</p>
                </div>
                <div className="rounded bg-emerald-50 text-[9px] font-bold text-emerald-700 px-2 py-0.5 border border-emerald-100">Verified</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
