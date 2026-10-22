import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Package,
  Tag,
  ShoppingBag,
  Users,
  LoaderCircle,
} from "lucide-react";
import apiClient from "../../services/api/axios";

type SearchResult = {
  id: string;
  type: "product" | "category" | "order" | "customer";
  title: string;
  subtitle: string;
  url: string;
};

type SearchResponse = {
  success: boolean;
  message: string;
  data: {
    results: SearchResult[];
  };
};

const resultIcons = {
  product: Package,
  category: Tag,
  order: ShoppingBag,
  customer: Users,
};

const resultLabels = {
  product: "Product",
  category: "Category",
  order: "Order",
  customer: "User",
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get<SearchResponse>("/admin/search", {
          params: { q: trimmedQuery },
        });

        if (!cancelled) {
          setResults(response.data.data.results);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Search failed. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(result.url);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div
        className={`flex h-11 items-center gap-3 rounded-xl border bg-white px-3 transition
          ${
            open
              ? "border-[#1F6F5C] ring-2 ring-[#1F6F5C]/10"
              : "border-gray-200 hover:border-gray-300"
          }`}
      >
        <Search size={18} className="shrink-0 text-gray-400" />

        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search products, orders, customers..."
          aria-label="Search products, orders, customers and categories"
          aria-expanded={open}
          aria-controls="global-search-results"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        {loading ? (
          <LoaderCircle
            size={17}
            className="shrink-0 animate-spin text-[#1F6F5C]"
          />
        ) : (
          <span className="hidden shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline">
            Ctrl K
          </span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Search results
            </p>
          </div>

          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-sm text-red-600">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Search size={22} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">
                No results found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try another product, order or customer.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-1.5">
              {results.map((result) => {
                const Icon = resultIcons[result.type];

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[#1F6F5C]/5 focus:bg-[#1F6F5C]/5 focus:outline-none"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Icon size={19} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {result.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {result.subtitle}
                      </span>
                    </span>

                    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">
                      {resultLabels[result.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-[11px] text-gray-400">
              Search across products, categories, orders and customers
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
