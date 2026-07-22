import { Flag, MessageSquare, Trash2 } from 'lucide-react';
import { deleteReview, listReviews } from '../../lib/actions';

export const metadata = {
  title: 'Reviews · FabZone Admin',
};

export default async function ReviewsPage() {
  const reviews = await listReviews();

  return (
    <div className="flex flex-col gap-6 px-10 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2185b]">Moderation</p>
          <h2 className="text-2xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">Customer Reviews</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#F7E4E6] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <MessageSquare className="h-4 w-4 text-[#c2185b]" />
          {reviews.length} total
        </div>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {reviews.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No reviews found.</p>
        ) : (
          <div className="mt-2 divide-y divide-[#F7E4E6]/60">
            {reviews.map((review: any) => (
              <div key={review.id} className="flex flex-col gap-3 py-5 transition-colors hover:bg-slate-50/20 px-2 rounded-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1A1A2D]">
                      {review.productName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      By {review.buyerName} · {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p className="mt-1 text-xs text-amber-500 font-bold tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">{review.comment || 'No written comment.'}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {review.isReported && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase text-rose-600">
                        <Flag className="h-3 w-3" /> Reported
                      </span>
                    )}
                    <form action={deleteReview.bind(null, review.id)}>
                      <button
                        type="submit"
                        className="glow-btn inline-flex items-center gap-1.5 rounded-lg border border-rose-250 bg-rose-50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </form>
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
