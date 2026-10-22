import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useDeleteProduct,
  useProducts,
} from "./products.queries";
import ProductsLoader from "./ProductsLoader";
import type { PetType, Product } from "./products.api";
import { useNavigate } from "react-router-dom";

const petTypeOptions: { label: string; value: PetType | "" }[] = [
  { label: "All pet types", value: "" },
  { label: "Dog", value: "DOG" },
  { label: "Cat", value: "CAT" },
  { label: "Bird", value: "BIRD" },
  { label: "Fish", value: "FISH" },
  { label: "Small pet", value: "SMALL_PET" },
  { label: "Other", value: "OTHER" },
];

const currency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

function getProductPrice(product: Product) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  if (activeVariants.length === 0) return null;

  const prices = activeVariants.map((variant) => variant.pricePaise);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function getProductStock(product: Product) {
  return product.variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + variant.stockQty, 0);
}

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [petType, setPetType] = useState<PetType | "">("");
  const [sort, setSort] = useState<
    "newest" | "price_asc" | "price_desc" | "rating"
  >("newest");
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const limit = 10;

  const params = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(petType ? { petType } : {}),
    sort,
  };

  const { data, isPending, isError, isFetching, refetch } = useProducts(params);

  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteProduct();

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const categoryOptions = categories.flatMap((item) => [
    item,
    ...(item.children ?? []),
  ]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setPetType("");
    setSort("newest");
    setPage(1);
  }

  const navigate = useNavigate();

  function openCreateForm() {
    navigate("/products/new");
  }

  function openEditForm(product: Product) {
    navigate(`/products/${product.id}/edit`);
  }

  async function handleDelete() {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);

      toast.success("Product deleted successfully.");

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }

      setProductToDelete(null);
    } catch {
      toast.error("Could not delete this product. Please try again.");
    }
  }

  return (
    <div className="min-w-0 space-y-5 pb-8 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Package size={16} />
            <span>Catalogue</span>
            <ChevronRight size={14} />
            <span className="font-medium text-[#295F4C]">Products</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your pet store products and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#295F4C] px-4 py-3 text-sm font-semibold text-white  transition hover:bg-[#214d3e]"
        >
          <Plus size={18} />
          Add product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <p className="text-sm text-slate-500">Products on this page</p>
          <p className="mt-2 text-2xl  text-slate-900">
            {isPending ? "—" : products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 ">
          <p className="text-sm text-slate-500">Total matching products</p>
          <p className="mt-2 text-2xl  text-slate-900">
            {isPending ? "—" : (pagination?.total ?? products.length)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <p className="text-sm text-slate-500">Current page</p>
          <p className="mt-2 text-2xl  text-slate-900">
            {isPending
              ? "—"
              : `${pagination?.page ?? page} / ${Math.max(pagination?.totalPages ?? 1, 1)}`}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#295F4C]" />
            <h2 className="font-semibold text-slate-900">Search & filters</h2>
            {isFetching && (
              <LoaderCircle
                size={15}
                className="ml-auto animate-spin text-[#49866E]"
              />
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by product name or brand..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#49866E] focus:bg-white focus:ring-2 focus:ring-[#49866E]/15"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-[#295F4C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d3e]"
            >
              Search
            </button>
          </form>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15"
            >
              <option value="">All categories</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.parentId ? "— " : ""}
                  {item.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by pet type"
              value={petType}
              onChange={(event) => {
                setPetType(event.target.value as PetType | "");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15"
            >
              {petTypeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort products"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as typeof sort);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-[#295F4C] hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {isError ? (
          <div className="p-6 sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">
                Products could not be loaded
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Check that the backend is running and your admin session is
                valid.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d3e]"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        ) : isPending ? (
          <div className="p-3 sm:p-5">
            <ProductsLoader />
          </div>
        ) : products.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#295F4C]/8 text-[#295F4C]">
              <Package size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No products found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters, or add a new product.
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d3e]"
            >
              <Plus size={16} />
              Add product
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Product</th>
                    <th className="px-4 py-4">Category / Pet</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Stock</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const price = getProductPrice(product);
                    const stock = getProductStock(product);
                    const image = product.images?.[0]?.url;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <ImageIcon
                                  size={20}
                                  className="text-slate-300"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-slate-700">
                            {product.category?.name ?? "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {product.petType.replace("_", " ")}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {price
                            ? price.min === price.max
                              ? currency(price.min)
                              : `${currency(price.min)} – ${currency(price.max)}`
                            : "No active variant"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              stock === 0
                                ? "bg-red-50 text-red-700"
                                : stock < 10
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {stock} units
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              onClick={() => openEditForm(product)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#49866E] hover:bg-[#49866E]/10 hover:text-[#295F4C]"
                            >
                              <SquarePen size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => setProductToDelete(product)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {products.map((product) => {
                const price = getProductPrice(product);
                const stock = getProductStock(product);
                const image = product.images?.[0]?.url;

                return (
                  <article
                    key={product.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {product.brand}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#295F4C]">
                          {price
                            ? price.min === price.max
                              ? currency(price.min)
                              : `${currency(price.min)} – ${currency(price.max)}`
                            : "No active variant"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {product.category?.name ?? "No category"}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {product.petType.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          stock === 0
                            ? "bg-red-50 text-red-700"
                            : stock < 10
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {stock} units
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <SquarePen size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => setProductToDelete(product)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                Showing {pagination?.total ? (page - 1) * limit + 1 : 0}–
                {Math.min(page * limit, pagination?.total ?? products.length)}{" "}
                of {pagination?.total ?? products.length} products
              </p>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="min-w-16 text-center text-sm font-semibold text-slate-700">
                  {page} / {Math.max(pagination?.totalPages ?? 1, 1)}
                </span>
                <button
                  type="button"
                  disabled={isFetching || page >= (pagination?.totalPages ?? 1)}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {productToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteMutation.isPending
            ) {
              setProductToDelete(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-description"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
          >
            {/* Centered heading with icon */}
            <h2
              id="delete-product-title"
              className="flex items-center justify-center gap-2 text-lg font-semibold text-slate-900"
            >
              <Trash2 size={20} className="shrink-0 text-red-500" />
              Delete product?
            </h2>

            {/* Description */}
            <p
              id="delete-product-description"
              className="mt-3 text-center text-sm leading-6 text-slate-500"
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                {productToDelete.name}
              </span>
              ?
            </p>

            {/* Cancel left, Delete right */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setProductToDelete(null)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => void handleDelete()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214D3E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
