
import { PawPrint, Sparkles } from "lucide-react";

type ProductsLoaderProps = {
  title?: string;
  description?: string;
};

export default function ProductsLoader({
  title = "Fetching your products",
  description = "Our little paws are getting everything ready. Just a moment!",
}: ProductsLoaderProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#295F4C]/10 bg-gradient-to-br from-white via-[#f3f8f4] to-[#e8f2eb] px-5 py-12"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#49866E]/10 [animation-duration:2s]" />
        <div className="absolute inset-2 rounded-full border border-[#49866E]/20" />

        <div className="relative flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-[#295F4C] text-white shadow-xl shadow-[#295F4C]/20 [animation-duration:1.5s]">
          <PawPrint size={34} strokeWidth={1.7} />
        </div>

        <Sparkles
          size={20}
          className="absolute -right-1 top-1 animate-pulse text-amber-500"
        />
        <Sparkles
          size={16}
          className="absolute -left-1 bottom-3 animate-pulse text-[#49866E]"
        />
      </div>

      <h2 className="mt-7 text-xl font-bold tracking-tight text-[#295F4C] sm:text-2xl">
        {title}
      </h2>

      <p className="mt-2 max-w-sm text-center text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#295F4C] [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#49866E] [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#91B8A3] [animation-delay:300ms]" />
      </div>

      <span className="sr-only">Please wait while the data loads.</span>
    </div>
  );
}
