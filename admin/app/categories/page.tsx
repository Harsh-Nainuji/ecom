import { Tag } from 'lucide-react';
import { listCategories } from '../../lib/actions';
import CategoriesClient from './CategoriesClient';

export const revalidate = 0;

export const metadata = {
  title: 'Categories · FabZone Admin',
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Catalog Management</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Product Categories</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <Tag className="h-4 w-4 text-[#c2185b]" />
          {categories.length} categories
        </div>
      </div>

      <CategoriesClient categories={categories} />
    </div>
  );
}
