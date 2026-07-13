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
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Catalog</p>
          <h2 className="text-3xl font-semibold text-slate-900">Products</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <PackageSearch className="h-4 w-4" />
          {products.length} listed
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No products yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {products.map((product) => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    Seller: {product.sellerName} · ₹{product.price.toLocaleString('en-IN')} · {product.imageCount} image
                    {product.imageCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-slate-400">
                    Added {new Date(product.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge[product.status] ?? statusBadge.draft}`}>
                    {product.status}
                  </span>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
