import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  PawPrint,
  ShoppingBag,
  X,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  LoaderCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUserDetails,
  updateUserStatus,
  type AdminUser,
  type UserStatus,
} from "../../services/api/users";

const green = "#295F4C";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function Avatar({ user }: { user: AdminUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ background: "#E4F0E9", color: green }}
    >
      {user.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Blocked"}
    </span>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users", search, status, role, sort, page],
    queryFn: () =>
      getUsers({
        search: search || undefined,
        status: status ? (status as UserStatus) : undefined,
        role: role ? (role as "CUSTOMER" | "ADMIN") : undefined,
        sort,
        page,
        limit: 8,
      }),
  });

  const detailsQuery = useQuery({
    queryKey: ["admin-user-details", selectedUserId],
    queryFn: () => getUserDetails(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      updateUserStatus(userId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin-user-details", selectedUserId],
      });
    },
  });

  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;
  const selectedUser = detailsQuery.data;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 text-sm text-gray-500">Dashboard / Users</div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Users Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer profiles, pets and orders.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <Users size={18} style={{ color: green }} />
          <span>Total users:</span>
          <strong className="text-gray-900">{pagination?.total ?? "—"}</strong>
        </div>
      </div>

      <div
        className={`grid min-w-0 gap-5 ${
          selectedUserId
            ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px]"
            : "grid-cols-1"
        }`}
      >
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, email or phone..."
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#295F4C] focus:ring-2 focus:ring-[#295F4C]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3">
                  <SlidersHorizontal size={15} className="text-gray-500" />
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent py-3 text-sm outline-none"
                  >
                    <option value="">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </label>

                <select
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#295F4C]"
                >
                  <option value="">All roles</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as "newest" | "oldest");
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#295F4C]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

          {usersQuery.isPending ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} />
              Loading users...
            </div>
          ) : usersQuery.isError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="text-red-500" size={28} />
              <p className="font-semibold text-gray-800">
                Could not load users
              </p>
              <p className="text-sm text-gray-500">
                Check your login session and backend server.
              </p>
              <button
                onClick={() => usersQuery.refetch()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: green }}
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <Users size={32} className="mb-3 text-gray-300" />
              <p className="font-semibold text-gray-800">No users found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full min-w-0">
                <table className="w-full table-fixed text-left">
                  <thead className="bg-gray-50/80">
                    <tr className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <th className="w-[25%] px-2 py-4 sm:px-3">User</th>
                      <th className="w-[16%] px-2 py-4">Phone</th>
                      <th className="w-[11%] px-2 py-4">Role</th>
                      <th className="w-[12%] px-2 py-4">Status</th>
                      <th className="w-[8%] px-2 py-4">Orders</th>
                      <th className="w-[15%] px-2 py-4">Joined</th>
                      <th className="w-[13%] px-2 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100"
                      >
                        <td className="px-2 py-3 sm:px-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar user={user} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900">
                                {user.name}
                              </p>
                              <p className="truncate text-[10px] text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-2 py-3 text-xs text-gray-600">
                          {user.phone || "—"}
                        </td>

                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-[#DDF3E8] text-[#176B50]"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {user.role === "ADMIN" ? "Admin" : "Customer"}
                          </span>
                        </td>

                        <td className="px-2 py-3">
                          <StatusBadge status={user.status} />
                        </td>

                        <td className="px-2 py-3 text-center text-xs text-gray-600">
                          {user._count.orders}
                        </td>

                        <td className="whitespace-nowrap px-2 py-3 text-xs text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            title={`View ${user.name}'s profile`}
                            aria-label={`View ${user.name}'s profile`}
                            className="inline-flex items-center justify-center gap-1 bg-white px-2 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#295F4C] hover:text-[#295F4C]"
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {pagination?.page ?? page} of{" "}
                  {Math.max(1, pagination?.totalPages ?? 1)} ·{" "}
                  {pagination?.total ?? 0} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={page >= (pagination?.totalPages ?? 1)}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {selectedUserId && (
          <aside className="h-fit min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">User profile</h2>
              <button
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close user profile"
              >
                <X size={18} />
              </button>
            </div>

            {detailsQuery.isPending ? (
              <div className="flex min-h-64 items-center justify-center">
                <LoaderCircle
                  className="animate-spin"
                  style={{ color: green }}
                />
              </div>
            ) : detailsQuery.isError || !selectedUser ? (
              <div className="p-6 text-sm text-red-600">
                Unable to load this user's details.
              </div>
            ) : (
              <div className="space-y-6 p-5">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold"
                    style={{ background: "#E4F0E9", color: green }}
                  >
                    {selectedUser.avatarUrl ? (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      selectedUser.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedUser.name}
                  </h3>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    {selectedUser.email}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <PawPrint size={18} style={{ color: green }} />
                    <p className="mt-3 text-xl font-bold text-gray-900">
                      {selectedUser._count?.pets ??
                        selectedUser.pets?.length ??
                        0}
                    </p>
                    <p className="text-xs text-gray-500">Pets</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <ShoppingBag size={18} style={{ color: green }} />
                    <p className="mt-3 text-xl font-bold text-gray-900">
                      {selectedUser._count?.orders ??
                        selectedUser.orders?.length ??
                        0}
                    </p>
                    <p className="text-xs text-gray-500">Total orders</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-gray-900">
                    Contact information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-gray-600">
                      <Mail
                        size={17}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <span className="break-all">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600">
                      <Phone
                        size={17}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <span>{selectedUser.phone || "No phone added"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600">
                      <CalendarDays
                        size={17}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <span>Joined {formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-gray-900">Pets</h4>
                  {selectedUser.pets?.length ? (
                    <div className="space-y-2">
                      {selectedUser.pets.map(
                        (pet: {
                          id: string;
                          name: string;
                          type: string;
                          breed?: string | null;
                        }) => (
                          <div
                            key={pet.id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F0E9]">
                              <PawPrint size={18} style={{ color: green }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {pet.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pet.breed || pet.type}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                      No pets added yet.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-gray-900">
                    Recent orders
                  </h4>
                  {selectedUser.orders?.length ? (
                    <div className="space-y-3">
                      {selectedUser.orders.map(
                        (order: {
                          id: string;
                          orderNumber: number;
                          status: string;
                          totalPaise: number;
                          createdAt: string;
                        }) => (
                          <div
                            key={order.id}
                            className="rounded-xl border border-gray-100 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                #{order.orderNumber}
                              </p>
                              <span className="text-xs text-gray-500">
                                {order.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                              <span>{formatDate(order.createdAt)}</span>
                              <strong className="text-sm text-gray-900">
                                {formatPrice(order.totalPaise)}
                              </strong>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                      No orders yet.
                    </p>
                  )}
                </div>

                {selectedUser.role !== "ADMIN" && (
                  <div className="border-t border-gray-100 pt-5">
                    {statusMutation.isError && (
                      <p className="mb-3 text-sm text-red-600">
                        Could not update status. Please try again.
                      </p>
                    )}
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          userId: selectedUser.id,
                          status:
                            selectedUser.status === "ACTIVE"
                              ? "BLOCKED"
                              : "ACTIVE",
                        })
                      }
                      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                        selectedUser.status === "ACTIVE"
                          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "text-white hover:opacity-90"
                      }`}
                      style={
                        selectedUser.status === "BLOCKED"
                          ? { background: green }
                          : undefined
                      }
                    >
                      {statusMutation.isPending
                        ? "Updating..."
                        : selectedUser.status === "ACTIVE"
                          ? "Block user"
                          : "Unblock user"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
