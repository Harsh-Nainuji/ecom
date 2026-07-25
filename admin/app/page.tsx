import {
  AlertOctagon,
  ArrowUpRight,
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
import { MetricCard } from '../components/MetricCard';
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
    ...(stats.lowStock.length
      ? [
          {
            title: 'Inventory risk',
            description: `${stats.lowStock.length} SKU${stats.lowStock.length > 1 ? 's' : ''} running low on stock.`,
            type: 'warning' as const,
          },
        ]
      : []),
    ...(stats.failedDeliveryCount
      ? [
          {
            title: 'Delivery SLA breach',
            description: `${stats.failedDeliveryCount} delivery attempt${stats.failedDeliveryCount > 1 ? 's' : ''} marked as failed.`,
            type: 'error' as const,
          },
        ]
      : []),
    ...(stats.pendingSellerCount
      ? [
          {
            title: 'Seller documents pending',
            description: `${stats.pendingSellerCount} seller application${stats.pendingSellerCount > 1 ? 's' : ''} awaiting review.`,
            type: 'info' as const,
          },
        ]
      : []),
  ];

  const metrics = [
    {
      label: 'Gross merchandise value',
      value: formatCurrency(stats.gmv),
      sublabel: 'Lifetime order volume',
      icon: <TrendingUp className="h-4 w-4" />,
      accent: 'emerald' as const,
    },
    {
      label: 'New buyers',
      value: String(stats.newBuyerCount),
      sublabel: `${stats.buyerCount} total buyers`,
      icon: <Users className="h-4 w-4" />,
      accent: 'sky' as const,
    },
    {
      label: 'Pending seller payouts',
      value: formatCurrency(stats.pendingPayoutTotal),
      sublabel: `${stats.pendingSellerCount} seller applications pending`,
      icon: <CreditCard className="h-4 w-4" />,
      accent: 'amber' as const,
    },
    {
      label: 'Support escalations',
      value: `${escalations} open`,
      sublabel: `${stats.failedDeliveryCount} failed · ${stats.cancelledOrderCount} cancelled`,
      icon: <AlertOctagon className="h-4 w-4" />,
      accent: 'rose' as const,
    },
    {
      label: 'Database used',
      value: usage ? `${usage.usedPercent}%` : '—',
      sublabel: usage
        ? `${formatBytes(usage.usedBytes)} of ${formatBytes(usage.totalBytes)} used · ${formatBytes(usage.remainingBytes)} left`
        : 'Unable to load usage',
      icon: <Database className="h-4 w-4" />,
      accent: 'violet' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-8 px-10 py-8">
      {/* Top Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Realtime Operations</p>
            <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Marketplace Pulse</h2>
          </div>
          <a
            href="/"
            className="glow-btn inline-flex items-center gap-2 rounded-xl bg-[#c2185b] px-4.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#a01046]"
          >
            Refresh Data
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        {usage && (
          <div className="rounded-2xl border border-[#F7E4E6] bg-white p-5 premium-shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A2D]">Database Storage</p>
                  <p className="text-[10px] text-slate-400">{formatBytes(usage.usedBytes)} used · {formatBytes(usage.remainingBytes)} left</p>
                </div>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${usage.usedPercent >= 80 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {usage.usedPercent}%
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${usage.usedPercent >= 80 ? 'bg-rose-500' : 'bg-violet-500'}`}
                style={{ width: `${Math.min(100, usage.usedPercent)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Main Board Grid */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* Live Fulfillment Board */}
        <div className="col-span-2 rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
          <div className="flex items-center justify-between border-b border-[#F7E4E6] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Order Logs</p>
              <h3 className="text-lg font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Fulfillment Board</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#EBFDF5] px-3 py-1 text-[10px] font-bold text-emerald-600 border border-[#A7F3D0]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <div className="divide-y divide-[#F7E4E6]">
            {stats.recentOrders.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">No recent orders found.</p>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex flex-wrap items-center gap-4 py-4.5 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                  <div className="w-24 font-mono text-[10px] font-semibold text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1A1A2D]">{order.buyer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} · {formatRelativeTime(order.placedAt)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#1A1A2D]">₹{order.amount.toLocaleString('en-IN')}</p>
                  <span className={['rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase', orderStatusPillClass(order.status)].join(' ')}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Watchlist */}
        <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
          <div className="flex items-center justify-between border-b border-[#F7E4E6] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Onboarding Watchlist</p>
              <h3 className="text-lg font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Seller Pipeline</h3>
            </div>
            <ShoppingBag className="h-4.5 w-4.5 text-[#c2185b]" />
          </div>
          <div className="mt-5 space-y-3">
            {stats.sellerPipeline.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No sellers currently in queue.</p>
            ) : (
              stats.sellerPipeline.map((seller: any) => (
                <div key={seller.id} className="rounded-xl border border-[#F7E4E6] bg-slate-50/30 p-3.5 transition-all hover:bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2D]">{seller.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{seller.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="rounded-lg bg-[#FFF0F2] border border-[#F7E4E6] px-2 py-0.5 text-[10px] font-bold text-[#c2185b]">
                      {seller.skuCount} SKUs
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Alert & Approvals Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Watchlist Alerts */}
        <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
          <div className="flex items-center justify-between border-b border-[#F7E4E6] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Priority Notifications</p>
              <h3 className="text-lg font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Incident Alerts</h3>
            </div>
            <ShieldAlert className="h-4.5 w-4.5 text-[#c2185b]" />
          </div>
          <div className="mt-5 space-y-3">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No critical alerts at this time.</p>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert.title} className="rounded-xl border border-[#F7E4E6] bg-slate-50/20 p-3.5">
                  <div className="flex items-start gap-3">
                    {alert.type === 'warning' && <Clock3 className="h-4 w-4 text-amber-600 mt-0.5" />}
                    {alert.type === 'error' && <AlertOctagon className="h-4 w-4 text-rose-600 mt-0.5" />}
                    {alert.type === 'info' && <PackageSearch className="h-4 w-4 text-sky-600 mt-0.5" />}
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2D]">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Approvals in Last 24 Hours */}
        <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
          <div className="flex items-center justify-between border-b border-[#F7E4E6] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Activity Report</p>
              <h3 className="text-lg font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Approvals (24h)</h3>
            </div>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { title: 'Buyer Verifications', value: `${stats.approvals24h.buyer ?? 0} new registrants` },
              { title: 'Seller Registrations', value: `${stats.approvals24h.seller ?? 0} applications approved` },
              { title: 'Delivery Network', value: `${stats.approvals24h.delivery ?? 0} partners active` },
            ].map((item: any) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-[#F7E4E6] px-4 py-3 bg-slate-50/10">
                <div>
                  <p className="text-xs font-bold text-[#1A1A2D]">{item.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.value}</p>
                </div>
                <div className="rounded-lg bg-[#EBFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">Verified</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
