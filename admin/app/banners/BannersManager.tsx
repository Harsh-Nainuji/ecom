'use client';

import { useState, useRef, useTransition } from 'react';
import { Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createBanner, deleteBanner, toggleBannerActive } from '../../lib/actions';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
}

export function BannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createBanner(formData);
        formRef.current?.reset();
        window.location.reload();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBanner(id);
        window.location.reload();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleToggle(id: string, active: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await toggleBannerActive(id, active);
        setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active } : b)));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        <h3 className="text-sm font-bold text-[#1A1A2D]">Upload a new banner</h3>
        <p className="text-[10px] text-slate-400 mt-1">JPEG/PNG only, maximum 5 MB. Recommended 1200×500 px.</p>
        <form ref={formRef} action={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</label>
            <input name="title" type="text" placeholder="Summer Sale" className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Link URL (optional)</label>
            <input name="linkUrl" type="url" placeholder="https://..." className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Display order</label>
            <input name="displayOrder" type="number" defaultValue={0} className="rounded-lg border border-[#F7E4E6] px-3 py-2 text-xs outline-none focus:border-[#c2185b]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Image</label>
            <input name="image" type="file" accept="image/*" className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#F7E4E6] file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-[#c2185b]" required />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input id="active" name="active" type="checkbox" defaultChecked value="true" className="h-4 w-4 accent-[#c2185b]" />
            <label htmlFor="active" className="text-xs font-semibold text-slate-600">Active</label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="glow-btn inline-flex items-center gap-2 rounded-xl bg-[#c2185b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#a01046] disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> {pending ? 'Uploading…' : 'Add Banner'}
            </button>
          </div>
          {error && (
            <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        <h3 className="text-sm font-bold text-[#1A1A2D]">Active banners</h3>
        {banners.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No banners uploaded yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
              <div key={banner.id} className="rounded-xl border border-[#F7E4E6] overflow-hidden">
                <div className="relative aspect-[2/1] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2D]">{banner.title || 'Untitled'}</p>
                      <p className="text-[10px] text-slate-400">Order: {banner.displayOrder}</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        banner.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {banner.active ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(banner.id, !banner.active)}
                      disabled={pending}
                      className="glow-btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#F7E4E6] bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      {banner.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {banner.active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id)}
                      disabled={pending}
                      className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
