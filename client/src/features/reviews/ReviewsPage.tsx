
import { useMemo, useState } from "react";
import {
  MessageSquare,
  Star,
  Clock3,
  EyeOff,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  LoaderCircle,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  useAdminReviews,
  useUpdateAdminReviewStatus,
} from "./reviews.queries";

import type { AdminReview, ReviewStatus } from "./reviews.api";

type ReviewTab = "ALL" | ReviewStatus;

const tabs: { label: string; value: ReviewTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Hidden", value: "HIDDEN" },
];

const statusLabels: Record<ReviewStatus, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  HIDDEN: "Hidden",
};

const statusStyles: Record<ReviewStatus, string> = {
  APPROVED: "bg-[#E4F7E9] text-[#18783B]",
  PENDING: "bg-[#FFF0DE] text-[#C66A0A]",
  HIDDEN: "bg-[#EEF1F5] text-[#596579]",
};

const statusDots: Record<ReviewStatus, string> = {
  APPROVED: "bg-[#16803D]",
  PENDING: "bg-[#E87916]",
  HIDDEN: "bg-[#7B8798]",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-[2px] whitespace-nowrap"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={15}
          strokeWidth={1.5}
          className={
            value <= rating
              ? "fill-[#E87916] text-[#E87916]"
              : "fill-[#E5E7EB] text-[#E5E7EB]"
          }
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${statusDots[status]}`} />
      {statusLabels[status]}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  detail,
}: {
  title: string;
  value: string | number;
  icon: typeof MessageSquare;
  tone: "green" | "orange" | "red" | "slate";
  detail?: string;
}) {
  const iconStyles = {
    green: "bg-[#E5F8E9] text-[#16803D]",
    orange: "bg-[#FFF0DF] text-[#E87916]",
    red: "bg-[#FFF0E7] text-[#D94A17]",
    slate: "bg-[#EDF0F5] text-[#596579]",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E6EAEE] bg-white px-4 py-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconStyles[tone]}`}
      >
        <Icon size={24} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[#647084]">{title}</p>
        <p className="mt-1 text-[27px]  leading-8 text-[#111827]">
          {value}
        </p>
        {detail && <p className="mt-1 text-[10px] text-[#778194]">{detail}</p>}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const reviewsQuery = useAdminReviews();
  const statusMutation = useUpdateAdminReviewStatus();

  const [activeTab, setActiveTab] = useState<ReviewTab>("ALL");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  const pageSize = 8;
  const reviews = reviewsQuery.data ?? [];

  const counts = useMemo(() => {
    return {
      ALL: reviews.length,
      PENDING: reviews.filter((review) => review.status === "PENDING").length,
      APPROVED: reviews.filter((review) => review.status === "APPROVED").length,
      HIDDEN: reviews.filter((review) => review.status === "HIDDEN").length,
    };
  }, [reviews]);

  const averageRating = useMemo(() => {
    const approvedReviews = reviews.filter(
      (review) => review.status === "APPROVED",
    );

    if (approvedReviews.length === 0) return "0.0";

    const average =
      approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
      approvedReviews.length;

    return average.toFixed(1);
  }, [reviews]);

  const products = useMemo(() => {
    return [...new Set(reviews.map((review) => review.product.name))].sort();
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesTab =
        activeTab === "ALL" || review.status === activeTab;

      const matchesSearch =
        !query ||
        review.product.name.toLowerCase().includes(query) ||
        review.user.name.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query);

      const matchesRating =
        ratingFilter === "ALL" || review.rating === Number(ratingFilter);

      const matchesProduct =
        productFilter === "ALL" || review.product.name === productFilter;

      return matchesTab && matchesSearch && matchesRating && matchesProduct;
    });
  }, [reviews, activeTab, search, ratingFilter, productFilter]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredReviews.length / pageSize),
  );

  const visibleReviews = filteredReviews.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const changeStatus = async (
    review: AdminReview,
    status: ReviewStatus,
  ) => {
    setNotice("");

    try {
      await statusMutation.mutateAsync({
        reviewId: review.id,
        status,
      });

      setNotice(
        status === "APPROVED"
          ? "Review approved successfully."
          : status === "HIDDEN"
            ? "Review hidden successfully."
            : "Review moved to pending.",
      );
    } catch {
      setNotice("Unable to update review. Please try again.");
    }
  };

  const clearFilters = () => {
    setActiveTab("ALL");
    setSearch("");
    setRatingFilter("ALL");
    setProductFilter("ALL");
    setPage(1);
  };

  if (reviewsQuery.isPending) {
    return (
      <div className="flex min-h-[360px] items-center justify-center gap-3 bg-[#F5F7F9] text-sm text-[#596579]">
        <LoaderCircle size={21} className="animate-spin" />
        Loading reviews...
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <div className="m-6 border border-[#E6EAEE] bg-white p-6">
        <AlertCircle size={28} className="mb-3 text-[#D94A17]" />
        <h2 className="font-semibold text-[#111827]">
          Unable to load reviews
        </h2>
        <p className="mt-2 text-sm text-[#667085]">
          Please check your admin login and backend connection.
        </p>

        <button
          type="button"
          onClick={() => void reviewsQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#167653] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#105C40]"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7F9] px-4 py-5 sm:px-6 lg:px-7">
      {/* Page heading */}
      <div className="mb-4">
        <h1 className="text-[28px] font-bold leading-9 tracking-tight text-[#111827]">
          Reviews
        </h1>
        <p className="text-sm text-[#737D8D]">
          Moderate customer reviews and ratings.
        </p>
      </div>

      {/* Statistics */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={counts.ALL}
          icon={MessageSquare}
          tone="green"
        />
        <StatCard
          title="Average Rating"
          value={averageRating}
          icon={Star}
          tone="orange"
        />
        <StatCard
          title="Pending Approval"
          value={counts.PENDING}
          icon={Clock3}
          tone="red"
        />
        <StatCard
          title="Hidden"
          value={counts.HIDDEN}
          icon={EyeOff}
          tone="slate"
        />
      </section>

      {/* Reviews table panel */}
      <section className="overflow-hidden rounded-xl border border-[#E6EAEE] bg-white">
        {/* Status tabs */}
        <div className="flex overflow-x-auto border-b border-[#E9EDF1] px-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`mr-4 shrink-0 border-b-[3px] px-2 py-3 text-xs font-semibold ${
                activeTab === tab.value
                  ? "border-[#167653] text-[#167653]"
                  : "border-transparent text-[#727C8D] hover:text-[#167653]"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-[#E9EDF1] p-4 md:grid-cols-2 2xl:grid-cols-[1.4fr_0.8fr_1fr_auto]">
          <div className="flex h-[42px] min-w-0 items-center gap-3 rounded-lg border border-[#DCE2E8] px-3">
            <Search size={18} className="shrink-0 text-[#697586]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by product or customer..."
              className="w-full min-w-0 bg-transparent text-xs text-[#273244] outline-none placeholder:text-[#8993A2]"
            />
          </div>

          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setPage(1);
              }}
              className="h-[42px] w-full appearance-none rounded-lg border border-[#DCE2E8] bg-white px-3 pr-9 text-xs text-[#3F4958] outline-none focus:border-[#167653]"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#657184]"
            />
          </div>

          <div className="relative">
            <select
              value={productFilter}
              onChange={(event) => {
                setProductFilter(event.target.value);
                setPage(1);
              }}
              className="h-[42px] w-full appearance-none rounded-lg border border-[#DCE2E8] bg-white px-3 pr-9 text-xs text-[#3F4958] outline-none focus:border-[#167653]"
            >
              <option value="ALL">All Products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#657184]"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="flex h-[42px] items-center justify-center gap-2 rounded-lg border border-[#E1E5EA] bg-[#F8F9FB] px-4 text-xs font-semibold text-[#4C5869] hover:bg-[#F0F3F6]"
          >
            <RotateCcw size={15} />
            Clear Filters
          </button>
        </div>

        {/* Mutation error */}
        {statusMutation.isError && (
          <div className="border-b border-[#F0CACA] bg-[#FFF6F5] px-4 py-3 text-xs text-[#B42318]">
            Review status update failed. Please try again.
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[225px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col />
              <col className="w-[115px]" />
              <col className="w-[115px]" />
              <col className="w-[105px]" />
            </colgroup>

            <thead>
              <tr className="h-[40px] bg-[#F7F8FA] text-[11px] font-semibold text-[#586476]">
                <th className="px-3">Product</th>
                <th className="px-3">Customer</th>
                <th className="px-3">Rating</th>
                <th className="px-3">Review</th>
                <th className="px-3">Date</th>
                <th className="px-3">Status</th>
                <th className="px-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EDF0F3]">
              {visibleReviews.map((review) => (
                <tr
                  key={review.id}
                  className="h-[60px] text-xs text-[#303B4B] hover:bg-[#FAFBFC]"
                >
                  <td className="px-3">
                    <p className="font-semibold leading-4">
                      {review.product.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#818B99]">
                      Product Review
                    </p>
                  </td>

                  <td className="px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#FCE7E7] text-[11px] font-bold text-[#B64B4B]">
                        {getInitials(review.user.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {review.user.name}
                        </p>

                        {review.isVerifiedPurchase && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#E3F8E9] px-1.5 py-0.5 text-[9px] font-semibold text-[#238044]">
                            <Check size={10} strokeWidth={3} />
                            Verified purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-3">
                    <RatingStars rating={review.rating} />
                  </td>

                  <td className="px-3">
                    <p className="line-clamp-2 leading-[17px] text-[#424D5D]">
                      {review.comment}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-3 text-[11px] text-[#657184]">
                    {formatDate(review.createdAt)}
                  </td>

                  <td className="px-3">
                    <StatusBadge status={review.status} />
                  </td>

                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Approve review"
                        aria-label={`Approve review by ${review.user.name}`}
                        disabled={
                          statusMutation.isPending ||
                          review.status === "APPROVED"
                        }
                        onClick={() => void changeStatus(review, "APPROVED")}
                        className="flex h-[34px] w-[38px] items-center justify-center rounded-lg border border-[#E1E6EA] text-[#24804D] hover:bg-[#E9F7EE] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Check size={17} strokeWidth={2.5} />
                      </button>

                      <button
                        type="button"
                        title={
                          review.status === "HIDDEN"
                            ? "Show review"
                            : "Hide review"
                        }
                        aria-label={
                          review.status === "HIDDEN"
                            ? "Show review"
                            : "Hide review"
                        }
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          void changeStatus(
                            review,
                            review.status === "HIDDEN"
                              ? "PENDING"
                              : "HIDDEN",
                          )
                        }
                        className="flex h-[34px] w-[38px] items-center justify-center rounded-lg border border-[#E1E6EA] text-[#465365] hover:bg-[#F0F3F6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {review.status === "HIDDEN" ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visibleReviews.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[#7C8796]"
                  >
                    No reviews found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-[#E9EDF1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#748092]">
            Showing{" "}
            <span className="font-semibold text-[#455164]">
              {filteredReviews.length === 0
                ? 0
                : (page - 1) * pageSize + 1}
              {"–"}
              {Math.min(page * pageSize, filteredReviews.length)}
            </span>{" "}
            of {filteredReviews.length} reviews
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E5EA] text-[#647084] hover:bg-[#F5F7F9] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter(
                (number) =>
                  number === 1 ||
                  number === pageCount ||
                  Math.abs(number - page) <= 1,
              )
              .reduce<(number | "ellipsis")[]>(
                (result, number, index, array) => {
                  if (
                    index > 0 &&
                    number - array[index - 1] > 1
                  ) {
                    result.push("ellipsis");
                  }

                  result.push(number);
                  return result;
                },
                [],
              )
              .map((number, index) =>
                number === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-7 items-center justify-center text-xs text-[#778194]"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold ${
                      page === number
                        ? "border-[#167653] bg-[#167653] text-white"
                        : "border-[#E1E5EA] bg-white text-[#586476] hover:bg-[#F5F7F9]"
                    }`}
                  >
                    {number}
                  </button>
                ),
              )}

            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E5EA] text-[#647084] hover:bg-[#F5F7F9] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Simple notification */}
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 border border-[#DCE8DF] bg-white px-4 py-3 text-sm text-[#344054]">
          {notice.startsWith("Unable") ? (
            <AlertCircle size={17} className="text-[#B42318]" />
          ) : (
            <Check size={17} className="text-[#16803D]" />
          )}

          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-2 text-[#7B8491]"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
