import { Users } from 'lucide-react';
import { listBuyers } from '../../lib/actions';
import BuyersClient from './BuyersClient';

export const revalidate = 0;

export const metadata = {
  title: 'Buyers · FabZone Admin',
};

export default async function BuyersPage() {
  const buyers = await listBuyers();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Accounts</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Buyer Registry</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <Users className="h-4 w-4 text-[#c2185b]" />
          {buyers.length} total
        </div>
      </div>

      <BuyersClient buyers={buyers} />
    </div>
  );
}
