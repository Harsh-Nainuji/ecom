import { getSupabaseAdmin } from '../supabaseAdmin';

export async function getAdminDashboardStats() {
  const supabase = getSupabaseAdmin();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const since24h = new Date();
  since24h.setDate(since24h.getDate() - 1);

  const [
    { data: gmvData, error: gmvError },
    { count: buyerCount, error: buyerError },
    { count: newBuyerCount, error: newBuyerError },
    { data: pendingPayoutData, error: pendingPayoutError },
    { count: pendingSellers, error: pendingSellerError },
    { count: failedDeliveries, error: failedDeliveryError },
    { count: cancelledOrders, error: cancelledError },
    { data: recentOrders, error: recentOrdersError },
    { data: sellerPipeline, error: sellerPipelineError },
    { data: lowStock, error: lowStockError },
    { data: approvals24h, error: approvalsError },
  ] = await Promise.all([
    supabase.from('orders').select('total_amount'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'buyer')
      .gte('created_at', since.toISOString()),
    supabase
      .from('orders')
      .select('total_amount')
      .in('order_status', ['paid', 'packed', 'shipped', 'out_for_delivery'])
      .neq('order_status', 'cancelled')
      .neq('order_status', 'delivered'),
    supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('delivery_status', 'failed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'cancelled'),
    supabase
      .from('orders')
      .select('id, total_amount, order_status, placed_at, shipping_address, profiles!orders_buyer_id_fkey(full_name), order_items(count)')
      .order('placed_at', { ascending: false })
      .limit(8),
    supabase
      .from('seller_profiles')
      .select('id, business_name, status, created_at, products:products(count)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('product_variants')
      .select('id, stock, products!inner(name, seller_id), size, color')
      .lte('stock', 5)
      .gt('stock', 0)
      .limit(10),
    supabase
      .from('profiles')
      .select('role', { count: 'exact' })
      .gte('created_at', since24h.toISOString()),
  ]);

  const firstError =
    gmvError ??
    buyerError ??
    newBuyerError ??
    pendingPayoutError ??
    pendingSellerError ??
    failedDeliveryError ??
    cancelledError ??
    recentOrdersError ??
    sellerPipelineError ??
    lowStockError ??
    approvalsError;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const gmv = (gmvData ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const pendingPayoutTotal = (pendingPayoutData ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount ?? 0),
    0,
  );

  const approvalsByRole = { buyer: 0, seller: 0, delivery: 0 } as Record<string, number>;
  if (approvals24h && Array.isArray(approvals24h)) {
    for (const row of approvals24h) {
      approvalsByRole[row.role] = (approvalsByRole[row.role] ?? 0) + 1;
    }
  }

  return {
    gmv,
    buyerCount: buyerCount ?? 0,
    newBuyerCount: newBuyerCount ?? 0,
    pendingPayoutTotal,
    pendingSellerCount: pendingSellers ?? 0,
    failedDeliveryCount: failedDeliveries ?? 0,
    cancelledOrderCount: cancelledOrders ?? 0,
    recentOrders: (recentOrders ?? []).map((order: any) => ({
      id: order.id,
      buyer: order.profiles?.full_name ?? 'Buyer',
      amount: Number(order.total_amount ?? 0),
      status: order.order_status,
      itemCount: Array.isArray(order.order_items) ? order.order_items.length : 0,
      placedAt: order.placed_at,
    })),
    sellerPipeline: (sellerPipeline ?? []).map((seller: any) => ({
      id: seller.id,
      name: seller.business_name,
      stage: seller.status,
      skuCount: Array.isArray(seller.products) ? seller.products.length : 0,
    })),
    lowStock: (lowStock ?? []).map((variant: any) => ({
      productName: variant.products?.name ?? 'Product',
      variant: `${variant.size ?? ''}${variant.size && variant.color ? ' / ' : ''}${variant.color ?? ''}`.trim() || 'Default',
      stock: variant.stock,
    })),
    approvals24h: approvalsByRole,
  };
}

export function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN');
}

const STATUS_PILL_CLASS: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 border border-slate-100',
  paid: 'bg-amber-50 text-amber-600 border border-amber-100',
  packed: 'bg-sky-50 text-sky-600 border border-sky-100',
  shipped: 'bg-sky-50 text-sky-600 border border-sky-100',
  out_for_delivery: 'bg-sky-50 text-sky-600 border border-sky-100',
  delivered: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-600 border border-rose-100',
};

export function orderStatusPillClass(status: string) {
  return STATUS_PILL_CLASS[status] ?? STATUS_PILL_CLASS.pending;
}

export function orderStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}
