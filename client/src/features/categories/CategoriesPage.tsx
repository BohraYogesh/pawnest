import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CategoryFormModal from "./CategoryFormModal";
import type { Category } from "./categories.api";
import { useCategories, useDeleteCategory } from "./categories.queries";

type StatusFilter = "all" | "active" | "inactive";

function statusClass(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : "bg-slate-100 text-slate-600 ring-slate-500/20";
}

export default function CategoriesPage() {
  const {
    data: categories = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useCategories();

  const deleteMutation = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const flatCategories = useMemo(
    () =>
      categories.flatMap((category) => [
        category,
        ...(category.children ?? []),
      ]),
    [categories],
  );

  const visibleCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    return flatCategories.filter((category) => {
      const matchesSearch =
        !term ||
        category.name.toLowerCase().includes(term) ||
        category.slug.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.isActive) ||
        (statusFilter === "inactive" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [flatCategories, search, statusFilter]);

  const activeCount = flatCategories.filter(
    (category) => category.isActive,
  ).length;

  const inactiveCount = flatCategories.length - activeCount;

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setShowForm(true);
  }

  async function confirmDelete() {
    if (!deleting) return;

    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Category deleted successfully.");
      setDeleting(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Could not delete this category. It may contain products or subcategories.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Catalog</span>
            <ChevronRight size={15} />
            <span className="font-medium text-[#295F4C]">Categories</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organize your products with main categories and subcategories.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#295F4C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#214d3e]"
        >
          <Plus size={18} />
          Add category
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total categories loaded
            </p>
            <span className="rounded-xl bg-[#295F4C]/10 p-2 text-[#295F4C]">
              <FolderTree size={19} />
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {flatCategories.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Main categories and subcategories
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Active</p>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 size={19} />
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {activeCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Available for storefront use
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Inactive</p>
            <span className="rounded-xl bg-slate-100 p-2 text-slate-600">
              <FolderTree size={19} />
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {inactiveCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Not shown in the storefront
          </p>
        </div>
      </div>

      {/* Categories table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-slate-900">All categories</h2>
            <p className="mt-1 text-xs text-slate-500">
              {visibleCategories.length} categories shown
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter by status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#49866E]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {isPending ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin text-[#295F4C]" size={20} />
            Loading categories...
          </div>
        ) : isError ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <AlertTriangle size={28} className="text-amber-600" />

            <p className="mt-3 font-semibold text-slate-900">
              Could not load categories
            </p>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {(error as Error)?.message ||
                "Check that the backend is running and you are signed in as an admin."}
            </p>

            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d3e]"
            >
              Try again
            </button>
          </div>
        ) : visibleCategories.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="rounded-2xl bg-[#295F4C]/10 p-4 text-[#295F4C]">
              <FolderTree size={28} />
            </span>

            <p className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== "all"
                ? "No matching categories"
                : "No categories yet"}
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "Try a different search or status filter."
                : "Create your first category to start organizing products."}
            </p>

            {!search && statusFilter === "all" && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d3e]"
              >
                <Plus size={17} />
                Add category
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Category</th>
                    <th className="px-5 py-3.5 font-semibold">Slug</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              category.parentId
                                ? "bg-slate-100 text-slate-500"
                                : "bg-[#295F4C]/10 text-[#295F4C]"
                            }`}
                          >
                            <FolderTree size={18} />
                          </span>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {category.parentId ? (
                                <span className="mr-1 text-slate-400">↳</span>
                              ) : null}
                              {category.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              ID: {category.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {category.slug}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {category.parentId ? "Subcategory" : "Main category"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(category.isActive)}`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(category)}
                            title="Edit category"
                            aria-label={`Edit ${category.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#49866E] hover:bg-[#49866E]/10 hover:text-[#295F4C]"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setDeleting(category)}
                            title="Delete category"
                            aria-label={`Delete ${category.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <span>
                Showing {visibleCategories.length} of {flatCategories.length}
              </span>

              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="font-semibold text-[#295F4C] hover:underline disabled:opacity-50"
              >
                {isFetching ? "Refreshing..." : "Refresh list"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Add / Edit modal */}
      {showForm && (
        <CategoryFormModal
          category={editing}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl bg-white p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={21} />
              </span>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-category-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Delete category?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-800">{deleting.name}</strong>?
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteMutation.isPending}
                aria-label="Close delete confirmation"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
