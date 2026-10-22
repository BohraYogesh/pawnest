
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock3,
  Truck,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminOrders,
  useUpdateAdminOrderStatus,
} from "./orders.queries";
import type { AdminOrder, OrderStatus } from "./orders.api";

const statuses: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PLACED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PLACED: "Placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-orange-50 text-orange-700",
  PLACED: "bg-blue-50 text-blue-700",
  PACKED: "bg-purple-50 text-purple-700",
  SHIPPED: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: typeof Package;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5E9E7] bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F4ED] text-[#246A50]">
        <Icon size={21} />
      </div>
      <div>
        <p className="text-xs text-[#737D89]">{title}</p>
        <p className="mt-1 text-2xl text-[#18231F]">{value}</p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const ordersQuery = useAdminOrders();
  const updateMutation = useUpdateAdminOrderStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const orders = ordersQuery.data ?? [];
  const pageSize = 8;

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(
      (o) => o.status === "PENDING_PAYMENT" || o.status === "PLACED",
    ).length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  }), [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        String(order.orderNumber).includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.user?.name ?? "").toLowerCase().includes(q) ||
        (order.user?.email ?? "").toLowerCase().includes(q) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(q),
        );

      return (
        matchesSearch &&
        (statusFilter === "ALL" || order.status === statusFilter) &&
        (paymentFilter === "ALL" || order.paymentStatus === paymentFilter)
      );
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleOrders = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function changeStatus(
    event: React.ChangeEvent<HTMLSelectElement>,
    order: AdminOrder,
  ) {
    event.stopPropagation();

    const status = event.target.value as OrderStatus;
    if (status === order.status) return;

    setUpdatingId(order.id);

    try {
      await updateMutation.mutateAsync({
        orderId: order.id,
        status,
      });
      toast.success(`Order #${order.orderNumber} status updated`);
    } catch {
      toast.error("Status update failed. Please check the backend response.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (ordersQuery.isPending) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-[#68756E]">
        <LoaderCircle size={21} className="animate-spin" />
        Loading orders...
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="m-6 rounded-xl border border-[#E5E9E7] bg-white p-6">
        <h2 className="font-semibold text-[#1E2923]">Unable to load orders</h2>
        <p className="mt-2 text-sm text-[#68756E]">
          Check your admin session and backend connection.
        </p>
        <button
          type="button"
          onClick={() => void ordersQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#246A50] px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[#F5F7F5] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-[#18231F]">Orders</h1>
        <p className="mt-1 text-sm text-[#737D89]">
          Manage customer orders, payments and deliveries.
        </p>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Orders" value={stats.total} icon={Package} />
        <StatCard title="Awaiting Processing" value={stats.pending} icon={Clock3} />
        <StatCard title="Shipped" value={stats.shipped} icon={Truck} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#E5E9E7] bg-white">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E9EDEA] p-4 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_210px_210px_auto]">
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#DCE3DE] px-3">
            <Search size={17} className="shrink-0 text-[#77837C]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search order, customer, product..."
              className="w-full min-w-0 bg-transparent text-xs outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#DCE3DE] bg-white px-3 text-xs outline-none"
          >
            <option value="ALL">All Order Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#DCE3DE] bg-white px-3 text-xs outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            {["PENDING", "PAID", "FAILED", "REFUNDED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPaymentFilter("ALL");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#DCE3DE] px-4 text-xs font-semibold text-[#45554B] hover:bg-[#F6F8F6]"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed text-left">
            <colgroup>
              <col className="w-[125px]" />
              <col className="w-[185px]" />
              <col />
              <col className="w-[115px]" />
              <col className="w-[115px]" />
              <col className="w-[150px]" />
              <col className="w-[175px]" />
            </colgroup>

            <thead className="bg-[#F7F9F7] text-[11px] font-semibold text-[#59675E]">
              <tr className="h-11">
                <th className="px-3">Order ID</th>
                <th className="px-3">Customer</th>
                <th className="px-3">Items</th>
                <th className="px-3">Total</th>
                <th className="px-3">Payment</th>
                <th className="px-3">Status</th>
                <th className="px-3">Update Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EDF0ED]">
              {visibleOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") navigate(`/orders/${order.id}`);
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`View order ${order.orderNumber}`}
                  className="h-[70px] cursor-pointer text-xs text-[#354239] hover:bg-[#F8FBF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#246A50]"
                >
                  <td className="px-3">
                    <p className="font-bold text-[#246A50]">#{order.orderNumber}</p>
                    <p className="mt-1 text-[10px] text-[#818C84]">
                      {dateLabel(order.createdAt)}
                    </p>
                  </td>

                  <td className="px-3">
                    <p className="truncate font-semibold">
                      {order.user?.name || "Customer"}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-[#818C84]">
                      {order.user?.email || order.userId}
                    </p>
                  </td>

                  <td className="px-3">
                    <p className="line-clamp-2 leading-4">
                      {order.items.map((item) => item.productName).join(", ") || "—"}
                    </p>
                    <p className="mt-1 text-[10px] text-[#818C84]">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-3 font-semibold">
                    {money(order.totalPaise)}
                  </td>

                  <td className="px-3">
                    <span className="text-[11px] font-semibold">
                      {order.paymentStatus}
                    </span>
                    <p className="mt-1 text-[10px] text-[#818C84]">
                      {order.paymentMethod}
                    </p>
                  </td>

                  <td className="px-3">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusClasses[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>

                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => void changeStatus(e, order)}
                        className="h-9 w-full appearance-none rounded-lg border border-[#DCE3DE] bg-white px-2 pr-7 text-[11px] outline-none focus:border-[#246A50] disabled:opacity-50"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {updatingId === order.id ? (
                        <LoaderCircle size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-spin" />
                      ) : (
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#77837C]">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E9EDEA] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#77837C]">
            Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE3DE] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-14 text-center text-xs text-[#59675E]">
              Page {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE3DE] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
