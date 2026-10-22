import {
  Users,
  Package,
  ShoppingCart,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import { useDashboardSummary } from "./dashboard.queries";
import ProductsLoader from "../products/ProductsLoader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const { data, isPending, isError, refetch, isFetching } =
    useDashboardSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#47836A]">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="flex min-h-[60px] items-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 sm:min-h-0 sm:px-4 sm:py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-5 text-red-700 sm:text-sm">
              Dashboard data load nahi ho paya. Backend aur admin login check
              karo.
            </p>
          </div>

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5 sm:text-sm"
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      )}

      {isPending ? (
        <ProductsLoader
          title="Preparing your dashboard"
          description="We're fetching your latest orders, sales and store activity."
        />
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={data.totalUsers.toLocaleString("en-IN")}
            icon={Users}
            description="Registered customers"
          />
          <StatCard
            title="Total Products"
            value={data.totalProducts.toLocaleString("en-IN")}
            icon={Package}
            description="Products in your store"
            iconClassName="bg-orange-50 text-orange-700"
          />
          <StatCard
            title="Total Orders"
            value={data.totalOrders.toLocaleString("en-IN")}
            icon={ShoppingCart}
            description={`${data.pendingOrders} pending orders`}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Paid Revenue"
            value={currencyFormatter.format(data.paidRevenuePaise / 100)}
            icon={IndianRupee}
            description="From paid orders"
            iconClassName="bg-purple-50 text-purple-700"
          />
        </div>
      ) : null}

      {data && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Store attention
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Items that may need your attention.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Low-stock variants</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.lowStockVariants}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Pending reviews</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.pendingReviews}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
