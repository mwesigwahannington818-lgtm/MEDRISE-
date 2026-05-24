import React, { useState } from "react";
import { useListFeedback } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, ThumbsDown, Minus, MessageSquareHeart } from "lucide-react";
import { format } from "date-fns";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };
const RATING_COLORS: Record<number, string> = {
  1: "bg-red-50 text-red-700 border-red-200",
  2: "bg-orange-50 text-orange-700 border-orange-200",
  3: "bg-yellow-50 text-yellow-700 border-yellow-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-green-50 text-green-700 border-green-200",
};

export default function FeedbackTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: feedbackList = [], isLoading } = useListFeedback({ query: {} as any });
  const [filter, setFilter] = useState<number | "all">("all");

  const filtered = filter === "all"
    ? feedbackList
    : feedbackList.filter(f => f.rating === filter);

  const avgRating = feedbackList.length
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
    : "—";

  const countByRating = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: feedbackList.filter(f => f.rating === r).length,
    pct: feedbackList.length ? Math.round((feedbackList.filter(f => f.rating === r).length / feedbackList.length) * 100) : 0,
  }));

  const recommend = {
    yes: feedbackList.filter(f => f.wouldRecommend === "yes").length,
    no: feedbackList.filter(f => f.wouldRecommend === "no").length,
    maybe: feedbackList.filter(f => f.wouldRecommend === "maybe").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Feedback</h1>
        <p className="text-gray-500 text-sm">Reviews and ratings submitted by patients about services received.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border shadow-none">
          <CardContent className="p-5 text-center">
            <p className="text-4xl font-bold text-yellow-500 mb-1">{avgRating}</p>
            <div className="flex justify-center mb-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-4 w-4 ${Number(avgRating) >= s ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500">{feedbackList.length} reviews</p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-3">Rating Breakdown</p>
            {countByRating.map(({ rating, count, pct }) => (
              <div key={rating} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-500 w-3">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-3">Would Recommend Us?</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-green-700"><ThumbsUp className="h-4 w-4" /> Yes</span>
                <span className="font-semibold text-green-700">{recommend.yes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-gray-500"><Minus className="h-4 w-4" /> Maybe</span>
                <span className="font-semibold text-gray-700">{recommend.maybe}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-red-600"><ThumbsDown className="h-4 w-4" /> No</span>
                <span className="font-semibold text-red-600">{recommend.no}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 mr-1">Filter:</span>
        {(["all", 5, 4, 3, 2, 1] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
            }`}
          >
            {f === "all" ? "All" : `${f} ★`}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <MessageSquareHeart className="h-10 w-10 opacity-30" />
          <p className="text-sm">No feedback yet for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(f => (
            <Card key={f.id} className="border shadow-none hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{f.patientName}</p>
                    {f.phone && <p className="text-xs text-gray-500">{f.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StarDisplay rating={f.rating} />
                    <Badge variant="outline" className={`text-xs ${RATING_COLORS[f.rating]}`}>
                      {RATING_LABELS[f.rating]}
                    </Badge>
                  </div>
                </div>
                {f.service && (
                  <p className="text-xs text-primary/80 font-medium mb-2">Service: {f.service}</p>
                )}
                {f.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 italic">"{f.comment}"</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span>{format(new Date(f.createdAt), "dd MMM yyyy")}</span>
                  {f.wouldRecommend && (
                    <span className={`font-medium ${f.wouldRecommend === "yes" ? "text-green-600" : f.wouldRecommend === "no" ? "text-red-500" : "text-gray-500"}`}>
                      {f.wouldRecommend === "yes" ? "✓ Recommends us" : f.wouldRecommend === "no" ? "✗ Does not recommend" : "~ Maybe recommends"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
