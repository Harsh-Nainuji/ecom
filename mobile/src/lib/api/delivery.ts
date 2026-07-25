import type { DeliveryAssignmentSummary, DeliveryOrderDetail, DeliveryState, OrderStatus } from '../types';
import { supabase } from '../supabase';

function formatAddress(address?: Record<string, string | undefined | null>) {
  if (!address) return '';
  return [address.line1, address.line2, address.city, address.state, address.postal_code]
    .filter(Boolean)
    .join(', ');
}

export async function fetchDeliveryAssignments(deliveryPartnerId: string): Promise<DeliveryAssignmentSummary[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, total_amount, order_status, delivery_status, placed_at, shipping_address, order_items(quantity, product:products(name))',
    )
    .eq('delivery_partner_id', deliveryPartnerId)
    .order('placed_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((order) => {
    const shipping = order.shipping_address as Record<string, string | undefined | null> | null;
    const firstItem = order.order_items?.[0];
    const productName = firstItem?.product?.[0]?.name ?? 'Item';
    const itemsLabel = firstItem ? `${productName} · ${firstItem.quantity} pcs` : '—';

    return {
      id: order.id,
      order_status: order.order_status as OrderStatus,
      delivery_status: (order.delivery_status ?? 'unassigned') as DeliveryState,
      buyer_name: shipping?.recipient_name ?? 'Customer',
      phone: shipping?.phone ?? undefined,
      address: formatAddress(shipping ?? undefined),
      total_amount: Number(order.total_amount ?? 0),
      items_label: itemsLabel,
      placed_at: order.placed_at,
    } satisfies DeliveryAssignmentSummary;
  });
}

export async function fetchDeliveryOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*), variant:product_variants(*)), delivery_otps(*)')
    .eq('id', orderId)
    .single();

  if (error) throw new Error(error.message);

  const shipping = (data?.shipping_address as Record<string, string>) ?? {};

  return {
    id: data.id,
    total_amount: Number(data.total_amount ?? 0),
    order_status: data.order_status as OrderStatus,
    placed_at: data.placed_at,
    shipping_address: {
      recipient_name: shipping.recipient_name ?? 'Customer',
      phone: shipping.phone ?? '',
      line1: shipping.line1 ?? '',
      line2: shipping.line2 ?? null,
      city: shipping.city ?? '',
      state: shipping.state ?? '',
      postal_code: shipping.postal_code ?? '',
    },
    order_items:
      data.order_items?.map((item: any) => ({
        id: item.id,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
        variant: item.variant ?? null,
        quantity: item.quantity,
        total_price: Number(item.total_price ?? 0),
      })) ?? [],
    delivery_otps: Array.isArray(data.delivery_otps) ? (data.delivery_otps[0] ?? null) : (data.delivery_otps ?? null),
    delivery_status: (data.delivery_status ?? 'unassigned') as DeliveryState,
    delivery_partner_id: data.delivery_partner_id,
  } satisfies DeliveryOrderDetail;
}

export async function updateDeliveryOrderStatus(orderId: string, nextStatus: OrderStatus, deliveryStatus?: DeliveryState) {
  const payload: Record<string, unknown> = { order_status: nextStatus };
  if (deliveryStatus) {
    payload.delivery_status = deliveryStatus;
  }

  const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
  if (error) throw new Error(error.message);
}

export async function verifyDeliveryOtp(orderId: string, otpInput: string) {
  const { data, error } = await supabase
    .from('delivery_otps')
    .select('otp_code, expires_at, used, attempt_count')
    .eq('order_id', orderId)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No active OTP found for this delivery');

  const nextAttempts = (data.attempt_count ?? 0) + 1;
  const now = Date.now();
  const expiryTime = data.expires_at ? new Date(data.expires_at).getTime() : 0;

  if (data.used) {
    throw new Error('OTP already used for this delivery');
  }

  if (expiryTime && expiryTime < now) {
    throw new Error('OTP has expired. Ask the customer to request a redelivery.');
  }

  if (data.otp_code.trim() !== otpInput.trim()) {
    await supabase.from('delivery_otps').update({ attempt_count: nextAttempts }).eq('order_id', orderId);
    throw new Error('Invalid OTP');
  }

  const { error: otpError } = await supabase
    .from('delivery_otps')
    .update({ used: true, attempt_count: nextAttempts })
    .eq('order_id', orderId);
  if (otpError) throw new Error(otpError.message);

  const { error: orderError } = await supabase
    .from('orders')
    .update({ order_status: 'delivered', delivery_status: 'completed' })
    .eq('id', orderId);
  if (orderError) throw new Error(orderError.message);
}
