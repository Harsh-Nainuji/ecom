import { PackageSearch, Trash2 } from 'lucide-react';
import { deleteProduct, listProducts } from '../../lib/actions';

export const metadata = {
  title: 'Products · FabZone Admin',
};

const statusBadge: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  inactive: 'bg-amber-50 text-amber-600 border-amber-200',
};

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Catalog</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Products List</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <PackageSearch className="h-4 w-4 text-[#c2185b]" />
          {products.length} listed
        </div>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {products.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No products listed in catalog.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {products.map((product: any) => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-4.5 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#1A1A2D]">{product.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Seller: {product.sellerName} · Price: ₹{product.price.toLocaleString('en-IN')} · Media: {product.imageCount} image{product.imageCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300 mt-1">
                    Added {new Date(product.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusBadge[product.status] ?? statusBadge.draft}`}>
                    {product.status}
                  </span>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <button
                      type="submit"
                      className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-rose-750 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
