'use client';

import { useState, useTransition } from 'react';
import { assignDeliveryPartner } from '../../lib/actions';

interface Partner {
  id: string;
  fullName: string;
  accountStatus: string;
}

export function DeliveryAssignmentSelect({
  orderId,
  currentPartnerId,
  partners,
}: {
  orderId: string;
  currentPartnerId: string | null;
  partners: Partner[];
}) {
  const [partnerId, setPartnerId] = useState<string>(currentPartnerId || '');
  const [isPending, startTransition] = useTransition();

  const activePartners = partners.filter((p) => p.accountStatus === 'approved');

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPartnerId(val);

    startTransition(async () => {
      try {
        await assignDeliveryPartner(orderId, val || null);
      } catch (err: any) {
        alert(err.message || 'Failed to assign partner');
      }
    });
  };

  return (
    <div className="relative inline-block w-48">
      <select
        value={partnerId}
        onChange={handleChange}
        disabled={isPending}
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none disabled:opacity-60"
      >
        <option value="">Unassigned (Not Assigned)</option>
        {activePartners.map((partner) => (
          <option key={partner.id} value={partner.id}>
            {partner.fullName}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="absolute right-7 top-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      )}
    </div>
  );
}
