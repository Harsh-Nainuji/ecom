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
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Moderation</p>
          <h2 className="text-3xl font-semibold text-slate-900">Customer Reviews</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <MessageSquare className="h-4 w-4" />
          {reviews.length} total
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-3 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {review.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      By {review.buyerName} · {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p className="mt-1 text-sm text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    <p className="mt-1 text-sm text-slate-700">{review.comment || 'No written comment.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isReported && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                        <Flag className="h-3 w-3" /> Reported
                      </span>
                    )}
                    <form action={deleteReview.bind(null, review.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
