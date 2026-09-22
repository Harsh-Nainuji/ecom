"use client";

import React, { useState } from 'react';
import { Truck, ExternalLink, Package, ShieldCheck, Edit3 } from 'lucide-react';
import { updateOrderWholesaleDetails, uploadPayoutProof } from '../../lib/actions';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-[#a0522d] border-[#F2E5D5]',
  paid: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  packed: 'bg-sky-50 text-sky-600 border-sky-100',
  shipped: 'bg-blue-50 text-blue-600 border-blue-100',
  out_for_delivery: 'bg-purple-50 text-purple-600 border-purple-100',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
};

export default function OrdersClient({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [shippingType, setShippingType] = useState<'retail' | 'wholesale'>('wholesale');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('shipped');
  const [etaDate, setEtaDate] = useState('');

  const [lrFile, setLrFile] = useState<File | null>(null);
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenModal = (order: any) => {
    setSelectedOrder(order);
    setShippingType(order.shippingType || 'wholesale');
    setTransporterName(order.transporterName || '');
    setVehicleNumber(order.vehicleNumber || '');
    setLrNumber(order.lrNumber || '');
    setOrderStatus(order.status || 'shipped');
    setEtaDate(order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toISOString().split('T')[0] : '');
    setLrFile(null);
    setPackageFile(null);
  };

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      let lrImageUrl = selectedOrder.lrImageUrl;
      let packageImageUrl = selectedOrder.packageImageUrl;

      if (lrFile) {
        const formData = new FormData();
        formData.append('file', lrFile);
        lrImageUrl = await uploadPayoutProof(formData);
      }

      if (packageFile) {
        const formData = new FormData();
        formData.append('file', packageFile);
        packageImageUrl = await uploadPayoutProof(formData);
      }

      const updateData: any = {
        order_status: orderStatus,
        shipping_type: shippingType,
      };

      if (shippingType === 'wholesale') {
        updateData.transporter_name = transporterName;
        updateData.vehicle_number = vehicleNumber;
        updateData.lr_number = lrNumber;
        if (lrImageUrl) updateData.lr_image_url = lrImageUrl;
        if (packageImageUrl) updateData.package_image_url = packageImageUrl;
        if (etaDate) updateData.estimated_delivery_at = new Date(etaDate).toISOString();
      }

      await updateOrderWholesaleDetails(selectedOrder.id, updateData);
      setSelectedOrder(null);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to update order logistics: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No orders placed matching the filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F7E4E6] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Order ID & Logistics</th>
                  <th className="pb-3.5">Placed At</th>
                  <th className="pb-3.5">Buyer</th>
                  <th className="pb-3.5">Seller</th>
                  <th className="pb-3.5">Amount</th>
                  <th className="pb-3.5 text-center">Shipping Type</th>
                  <th className="pb-3.5 text-center">Status</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E4E6]/60">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      {(order.transporterName || order.vehicleNumber || order.lrNumber) && (
                        <div className="mt-1 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          <Truck className="w-3 h-3 text-blue-600" />
                          <span>{order.transporterName || 'Transporter'} {order.vehicleNumber ? `• Gadi: ${order.vehicleNumber}` : ''} {order.lrNumber ? `• LR: ${order.lrNumber}` : ''}</span>
                        </div>
                      )}
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
                      <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${order.shippingType === 'wholesale' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                        {order.shippingType === 'wholesale' ? '🚚 Wholesale Cargo' : '🛵 Retail OTP'}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusBadge[order.status] ?? statusBadge.pending}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => handleOpenModal(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white font-bold px-3 py-1.5 hover:bg-slate-800 transition-all text-xs shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5 text-pink-400" />
                        🚚 Add / Edit Bilty
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Logistics Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-[#c2185b]" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    🚚 Add / Edit Bilty & Transport Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLogistics} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Delivery Mode (Mode Select Karein)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShippingType('wholesale')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${shippingType === 'wholesale' ? 'bg-[#c2185b] text-white border-[#c2185b]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    🚚 Wholesale Cargo (Gadi / Bilty)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingType('retail')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${shippingType === 'retail' ? 'bg-[#c2185b] text-white border-[#c2185b]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    🛵 Retail Delivery (OTP)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Order Status (Status Change Karein)
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 bg-slate-50"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {shippingType === 'wholesale' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Transporter / Transport Company Name (Transport Ka Naam)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics, SafeExpress, Local Tempo"
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Truck / Vehicle Registration Number (Gadi Ka Number)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH 12 AB 1234 / KA 01 XY 5678"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Lorry Receipt / Bilty Number (LR No.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LR-908123"
                      value={lrNumber}
                      onChange={(e) => setLrNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. Estimated Delivery Date (Kitne Din Me Pahunchega)
                    </label>
                    <input
                      type="date"
                      value={etaDate}
                      onChange={(e) => setEtaDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      5. Upload Bilty Receipt Photo (Bilty Ki Photo)
                    </label>
                    {selectedOrder.lrImageUrl && (
                      <div className="mb-2">
                        <a href={selectedOrder.lrImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 underline">
                          <ExternalLink className="w-3 h-3" /> View Uploaded Bilty Photo
                        </a>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLrFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6. Upload Samaan / Box Goods Photo (Samaan/Box Ki Photo)
                    </label>
                    {selectedOrder.packageImageUrl && (
                      <div className="mb-2">
                        <a href={selectedOrder.packageImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                          <ExternalLink className="w-3 h-3" /> View Uploaded Box Cargo Photo
                        </a>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPackageFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c2185b] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#a0134a] disabled:opacity-50 shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Transport Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
