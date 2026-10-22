
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  UserRound,
  CreditCard,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Circle,
  Copy,
  LoaderCircle,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useAdminOrders, useUpdateAdminOrderStatus } from "./orders.queries";
import type { OrderStatus } from "./orders.api";

const statuses: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PLACED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const labels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PLACED: "Placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const badgeClasses: Record<OrderStatus, string> = {
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

function dateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function addressLines(address: unknown): string[] {
  if (!address || typeof address !== "object") return [];

  const value = address as Record<string, unknown>;
  const keys = [
    "name",
    "fullName",
    "addressLine1",
    "addressLine2",
    "line1",
    "line2",
    "street",
    "landmark",
    "city",
    "state",
    "postalCode",
    "pincode",
    "zipCode",
    "country",
    "phone",
  ];

  return keys
    .map((key) => value[key])
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )
    .filter((item, index, all) => all.indexOf(item) === index);
}

function Card({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E4E9E5] bg-white">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#E9EDEA] px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#25352B]">
          <Icon size={17} className="text-[#287153]" />
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-[#77837B]">{label}</span>
      <span className="max-w-[65%] break-words text-right text-xs font-semibold text-[#344238]">
        {value}
      </span>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const ordersQuery = useAdminOrders();
  const updateMutation = useUpdateAdminOrderStatus();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const order = useMemo(
    () => ordersQuery.data?.find((item) => item.id === orderId),
    [ordersQuery.data, orderId],
  );

  const address = order ? addressLines(order.addressSnapshot) : [];

  async function copyOrderId() {
    if (!order) return;

    try {
      await navigator.clipboard.writeText(order.id);
      toast.success("Order ID copied");
    } catch {
      toast.error("Could not copy order ID");
    }
  }

  async function saveStatus() {
    if (!order || !selectedStatus || selectedStatus === order.status) return;

    setSaving(true);

    try {
      await updateMutation.mutateAsync({
        orderId: order.id,
        status: selectedStatus,
        note: note.trim() || undefined,
      });

      toast.success("Order status updated");
      setSelectedStatus("");
      setNote("");
    } catch {
      toast.error("Could not update order status. Check the backend response.");
    } finally {
      setSaving(false);
    }
  }

  if (ordersQuery.isPending) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-[#69766E]">
        <LoaderCircle size={21} className="animate-spin" />
        Loading order details...
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="m-6 rounded-xl border border-[#E4E9E5] bg-white p-6">
        <AlertCircle className="mb-3 text-red-600" size={25} />
        <h2 className="font-semibold text-[#25352B]">Unable to load order</h2>
        <button
          type="button"
          onClick={() => void ordersQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#246A50] px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="m-6 rounded-xl border border-[#E4E9E5] bg-white p-8 text-center">
        <Package size={34} className="mx-auto text-[#8B978F]" />
        <h2 className="mt-3 font-bold text-[#25352B]">Order not found</h2>
        <p className="mt-1 text-sm text-[#77837B]">
          This order may have been removed or is not available to your account.
        </p>
        <Link
          to="/orders"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#246A50] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  const history = [...(order.history ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <main className="min-h-full bg-[#F5F7F5] px-4 py-5 sm:px-6 lg:px-7">
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#47705A] hover:text-[#1D5D40]"
      >
        <ArrowLeft size={17} /> Back to Orders
      </Link>

      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold text-[#18231F]">
              Order #{order.orderNumber}
            </h1>
            <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${badgeClasses[order.status]}`}>
              {labels[order.status]}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-[#77837B]">
            <CalendarDays size={15} />
            Placed on {dateTime(order.createdAt)}
          </p>
          <button
            type="button"
            onClick={() => void copyOrderId()}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#287153]"
          >
            Order ID: {order.id} <Copy size={12} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | "")}
              className="h-10 min-w-44 appearance-none rounded-lg border border-[#DCE3DE] bg-white px-3 pr-8 text-xs outline-none focus:border-[#287153]"
            >
              <option value="">Update status...</option>
              {statuses.map((status) => (
                <option key={status} value={status} disabled={status === order.status}>
                  {labels[status]}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77837B]" />
          </div>
          <button
            type="button"
            disabled={!selectedStatus || selectedStatus === order.status || saving}
            onClick={() => void saveStatus()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E57C25] px-4 text-xs font-bold text-white hover:bg-[#CB6819] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="space-y-4">
          <Card title="Order Items" icon={Package}>
            <div className="divide-y divide-[#EDF0ED]">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E7EBE8] bg-[#F7F9F7]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package size={25} className="text-[#9AA69D]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#25352B]">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-xs text-[#77837B]">
                      Variant: {item.variantLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-[#77837B]">
                      SKU: {item.sku}
                    </p>
                    <p className="mt-2 text-xs text-[#46564B]">
                      {money(item.unitPricePaise)} × {item.quantity}
                    </p>
                  </div>

                  <p className="whitespace-nowrap text-sm font-bold text-[#25352B]">
                    {money(item.totalPaise)}
                  </p>
                </div>
              ))}

              {order.items.length === 0 && (
                <p className="py-5 text-sm text-[#77837B]">No items available.</p>
              )}
            </div>
          </Card>

          <Card title="Order Timeline" icon={Clock3}>
            {history.length > 0 ? (
              <div className="ml-1">
                {history.map((entry, index) => {
                  const last = index === history.length - 1;
                  return (
                    <div key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                      {!last && (
                        <div className="absolute bottom-0 left-[9px] top-5 w-px bg-[#DCE7DF]" />
                      )}
                      <div className="relative z-10 mt-0.5 text-[#287153]">
                        {last ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#344238]">
                          {labels[entry.status] ?? entry.status}
                        </p>
                        <p className="mt-1 text-[11px] text-[#77837B]">
                          {dateTime(entry.createdAt)}
                        </p>
                        {entry.note && (
                          <p className="mt-1 text-xs text-[#59675E]">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#77837B]">
                No status history has been returned for this order.
              </p>
            )}
          </Card>

          <Card title="Update History Note" icon={Truck}>
            <label className="mb-2 block text-xs font-medium text-[#59675E]">
              Optional note for the status change
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a delivery or processing note..."
              className="w-full resize-y rounded-lg border border-[#DCE3DE] px-3 py-2.5 text-xs outline-none focus:border-[#287153]"
            />
            <p className="mt-1 text-right text-[10px] text-[#8A958D]">
              {note.length}/500
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer Information" icon={UserRound}>
            <p className="text-sm font-bold text-[#25352B]">
              {order.user?.name || "Customer"}
            </p>
            <p className="mt-1 break-all text-xs text-[#77837B]">
              {order.user?.email || "Email not available"}
            </p>
            <p className="mt-1 text-xs text-[#77837B]">
              {order.user?.phone || "Phone not available"}
            </p>
            <div className="mt-3 border-t border-[#EDF0ED] pt-2">
              <InfoRow label="Customer ID" value={order.user?.id || order.userId} />
            </div>
          </Card>

          <Card title="Shipping Address" icon={MapPin}>
            {address.length ? (
              <div className="space-y-1 text-xs leading-5 text-[#59675E]">
                {address.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
              </div>
            ) : (
              <p className="text-xs leading-5 text-[#77837B]">
                The saved address is unavailable or uses a different field format.
              </p>
            )}
          </Card>

          <Card title="Payment Information" icon={CreditCard}>
            <InfoRow label="Payment Status" value={order.paymentStatus} />
            <InfoRow label="Payment Method" value={order.paymentMethod || "—"} />
            <InfoRow label="Transaction Reference" value={order.transactionRef || "—"} />
            <InfoRow label="Paid At" value={dateTime(order.paidAt)} />
          </Card>

          <Card title="Order Summary" icon={Package}>
            <InfoRow label="Subtotal" value={money(order.subtotalPaise)} />
            <InfoRow label="Shipping" value={money(order.shippingPaise)} />
            <InfoRow label="Discount" value={`−${money(order.discountPaise)}`} />
            <div className="mt-2 border-t border-[#E9EDEA] pt-2">
              <InfoRow
                label="Total"
                value={
                  <span className="text-base font-bold text-[#246A50]">
                    {money(order.totalPaise)}
                  </span>
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
