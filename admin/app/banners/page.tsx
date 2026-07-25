import { Image } from 'lucide-react';
import { listBanners } from '../../lib/actions';
import { BannersManager } from './BannersManager';

export const metadata = {
  title: 'Home Banners · FabZone Admin',
};

export default async function BannersPage() {
  const banners = await listBanners();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7E4E6]">
          <Image className="h-5 w-5 text-[#c2185b]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Marketing</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Home Banners</h2>
        </div>
      </div>
      <BannersManager initialBanners={banners} />
    </div>
  );
}
