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
  Calendar,
  MoreHorizontal,
  Plus
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
    ...(stats.lowStock.length ? [{ title: 'Inventory risk', description: `${stats.lowStock.length} SKU${stats.lowStock.length > 1 ? 's' : ''} running low`, type: 'warning' as const }] : []),
    ...(stats.failedDeliveryCount ? [{ title: 'Delivery SLA breach', description: `${stats.failedDeliveryCount} failed attempt${stats.failedDeliveryCount > 1 ? 's' : ''}`, type: 'error' as const }] : []),
    ...(stats.pendingSellerCount ? [{ title: 'Sellers pending', description: `${stats.pendingSellerCount} application${stats.pendingSellerCount > 1 ? 's' : ''} await review`, type: 'info' as const }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header section mimicking Donezo */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-[28px] font-bold text-slate-900 editorial-header tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Plan, prioritize, and accomplish your tasks with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full bg-[#c2185b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a01046] shadow-sm">
            <Plus className="h-4 w-4" />
            Add Action
          </button>
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm">
            Import Data
          </button>
        </div>
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Primary Color Card */}
        <div className="rounded-[1.5rem] bg-[#c2185b] p-5 shadow-sm text-white flex flex-col justify-between h-[140px] relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent w-full h-full"></div>
          <div className="flex items-start justify-between relative z-10">
            <span className="text-sm font-medium opacity-90">Total Orders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-bold tracking-tight mb-2">{stats.recentOrders.length + 12}</div>
            <div className="flex items-center gap-1.5 text-xs font-medium opacity-90 bg-white/10 w-max px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>Increased from last month</span>
            </div>
          </div>
        </div>

        {/* White Cards */}
        {[
          { label: 'New Buyers', value: stats.newBuyerCount, increase: true },
          { label: 'Pending Payouts', value: formatCurrency(stats.pendingPayoutTotal), increase: false, info: 'Review needed' },
          { label: 'Support Tickets', value: escalations, increase: false, info: 'On discuss' },
        ].map((card, i) => (
          <div key={i} className="rounded-[1.5rem] bg-white border border-slate-100 p-5 shadow-sm text-slate-900 flex flex-col justify-between h-[140px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-700">{card.label}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold tracking-tight mb-2 text-slate-800">{card.value}</div>
              {card.increase ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 w-max px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  <span>Increased from last month</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-400 pl-1">{card.info}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Analytics, Reminders, Project List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Mock Analytics Chart (Takes 5 cols) */}
        <div className="lg:col-span-5 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Sales Analytics</h3>
          <div className="flex items-end justify-between h-[120px] px-2 gap-2">
            {[40, 70, 90, 100, 60, 50, 45].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full relative flex items-end justify-center h-full rounded-t-full bg-slate-50">
                  <div 
                    className={`w-full rounded-t-full transition-all ${idx === 3 ? 'bg-[#c2185b]' : idx === 2 ? 'bg-pink-400' : idx === 1 ? 'bg-pink-300' : 'bg-slate-200'}`}
                    style={{ height: `${val}%` }}
                  />
                  {idx === 2 && (
                    <div className="absolute -top-6 bg-white border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-slate-700">74%</div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders (Takes 3 cols) */}
        <div className="lg:col-span-3 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Reminders</h3>
            <h4 className="text-lg font-bold text-slate-900 leading-tight">Meeting with Vendor Partners</h4>
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Time: 02.00 pm - 04.00 pm</span>
            </div>
          </div>
          <button className="mt-4 w-full rounded-full bg-[#1a1a24] text-white py-2.5 text-sm font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Start Meeting
          </button>
        </div>

        {/* Seller Pipeline (Takes 4 cols) */}
        <div className="lg:col-span-4 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Seller Pipeline</h3>
            <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          <div className="space-y-4">
            {stats.sellerPipeline.slice(0, 4).map((seller: any, idx: number) => (
              <div key={seller.id} className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${['bg-pink-100 text-pink-600', 'bg-sky-100 text-sky-600', 'bg-amber-100 text-amber-600', 'bg-violet-100 text-violet-600'][idx % 4]}`}>
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{seller.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{seller.stage.replace(/_/g, ' ')} • {seller.skuCount} SKUs</p>
                </div>
              </div>
            ))}
            {stats.sellerPipeline.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No sellers in pipeline</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Orders List, Progress, Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-6">
        {/* Recent Orders (Takes 5 cols) */}
        <div className="lg:col-span-5 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">Live Fulfillment Board</h3>
            <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              <Plus className="h-3 w-3" /> Add order
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentOrders.slice(0, 3).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
                    <img src={`https://i.pravatar.cc/150?u=${order.buyer}`} alt={order.buyer} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{order.buyer}</p>
                    <p className="text-[10px] font-semibold text-slate-400">Order #{order.id.slice(0, 6).toUpperCase()}</p>
                  </div>
                </div>
                <div className={`rounded text-[10px] font-bold px-2 py-0.5 ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Progress (Takes 4 cols) */}
        <div className="lg:col-span-4 rounded-[1.5rem] bg-white border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center relative">
          <h3 className="text-base font-bold text-slate-800 absolute top-6 left-6">System Progress</h3>
          {usage ? (
            <div className="relative mt-8 flex flex-col items-center">
              {/* Mock Donut Chart using CSS */}
              <div className="relative h-40 w-40 rounded-full border-[12px] border-slate-100 border-t-[#c2185b] border-r-[#c2185b] border-b-slate-100 border-l-[#c2185b] rotate-45 flex items-center justify-center">
                 <div className="-rotate-45 flex flex-col items-center text-center">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{usage.usedPercent}%</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">Storage Used</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 mt-6 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c2185b]"></span> Active</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-200"></span> Available</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Unable to load usage</div>
          )}
        </div>

        {/* GMV Tracker (Takes 3 cols) */}
        <div className="lg:col-span-3 rounded-[1.5rem] bg-[#1a1a24] p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent w-full h-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-300">Gross Value Tracker</h3>
            <div className="mt-8 text-center">
              <div className="text-3xl font-black text-white tracking-wider font-mono">
                {formatCurrency(stats.gmv).replace('₹', '')}
              </div>
              <div className="text-xs text-[#c2185b] font-bold mt-2">LIFETIME VOLUME</div>
            </div>
          </div>
          
          <div className="relative z-10 flex justify-center gap-3 mt-8">
            <button className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition">
              <span className="w-3 h-3 border-l-2 border-r-2 border-black"></span>
            </button>
            <button className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition">
              <span className="w-3 h-3 rounded-sm bg-white"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
