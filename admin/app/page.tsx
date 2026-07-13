import {
  AlertOctagon,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
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

export default async function Home() {
  let stats;
  try {
    stats = await getAdminDashboardStats();
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
  ];

  return (
    <div className="flex flex-col gap-8 px-10 py-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Realtime view</p>
            <h2 className="text-3xl font-semibold text-slate-900">Marketplace pulse</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            Refresh data
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="col-span-2 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Orders</p>
              <h3 className="text-xl font-semibold text-slate-900">Live fulfillment board</h3>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">Live</span>
          </div>
          <div className="mt-6 divide-y divide-slate-100">
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No orders yet.</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="w-24 font-mono text-xs text-slate-500">#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{order.buyer}</p>
                    <p className="text-xs text-slate-500">
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} · {formatRelativeTime(order.placedAt)}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">₹{order.amount.toLocaleString('en-IN')}</p>
                  <span className={['rounded-full px-3 py-1 text-xs font-semibold', orderStatusPillClass(order.status)].join(' ')}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Seller ops</p>
              <h3 className="text-xl font-semibold text-slate-900">Pipeline watchlist</h3>
            </div>
            <ShoppingBag className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 space-y-4">
            {stats.sellerPipeline.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No sellers in pipeline.</p>
            ) : (
              stats.sellerPipeline.map((seller) => (
                <div key={seller.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{seller.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                      {seller.skuCount} SKUs
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Alerts</p>
              <h3 className="text-xl font-semibold text-slate-900">Operational watchlist</h3>
            </div>
            <ShieldAlert className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-6 space-y-4">
            {alerts.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No active alerts.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    {alert.type === 'warning' && <Clock3 className="h-4 w-4 text-amber-500" />}
                    {alert.type === 'error' && <AlertOctagon className="h-4 w-4 text-rose-500" />}
                    {alert.type === 'info' && <PackageSearch className="h-4 w-4 text-sky-500" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-500">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Approvals</p>
              <h3 className="text-xl font-semibold text-slate-900">Last 24 hours</h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-6 space-y-5">
            {[
              { title: 'Buyer verifications', value: `${stats.approvals24h.buyer ?? 0} new` },
              { title: 'Seller onboarding', value: `${stats.approvals24h.seller ?? 0} new` },
              { title: 'Delivery partners', value: `${stats.approvals24h.delivery ?? 0} new` },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
                <div className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">Live</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
