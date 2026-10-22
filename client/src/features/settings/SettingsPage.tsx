import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Store,
  Package,
  Upload,
  LockKeyhole,
  Save,
  RotateCcw,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGeneralSettings,
  useUpdateGeneralSettings,
} from "./settings.queries";

import type { UpdateGeneralSettingsInput } from "./settings.api";

export default function SettingsPage() {
  const settingsQuery = useGeneralSettings();
  const updateMutation = useUpdateGeneralSettings();

  const [storeName, setStoreName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const settings = settingsQuery.data;

  // Form sirf pehli baar fill hoga, refetch par user ke edits overwrite nahi honge
  useEffect(() => {
    if (!settings || initializedRef.current) return;

    setStoreName(settings.storeName);
    setSupportEmail(settings.supportEmail);
    setPhone(settings.phone);
    setAddress(settings.address);
    setLowStockThreshold(String(settings.lowStockThreshold));

    initializedRef.current = true;
  }, [settings]);

  const isDirty =
    !!settings &&
    (storeName !== settings.storeName ||
      supportEmail !== settings.supportEmail ||
      phone !== settings.phone ||
      address !== settings.address ||
      lowStockThreshold !== String(settings.lowStockThreshold));

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1F6F5C] focus:ring-2 focus:ring-[#1F6F5C]/10";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  function resetForm() {
    if (!settings) return;

    setStoreName(settings.storeName);
    setSupportEmail(settings.supportEmail);
    setPhone(settings.phone);
    setAddress(settings.address);
    setLowStockThreshold(String(settings.lowStockThreshold));
    setLogoPreview(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }

    toast.info("Changes have been discarded.");
  }

  async function handleSave() {
    if (!storeName.trim()) {
      toast.error("Store name is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      toast.error("Please enter a valid support email.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    if (!address.trim()) {
      toast.error("Store address is required.");
      return;
    }

    const threshold = Number(lowStockThreshold);

    if (
      lowStockThreshold.trim() === "" ||
      !Number.isInteger(threshold) ||
      threshold < 1
    ) {
      toast.error("Low stock threshold must be a whole number, at least 1.");
      return;
    }

    const payload: UpdateGeneralSettingsInput = {
      storeName: storeName.trim(),
      supportEmail: supportEmail.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lowStockThreshold: threshold,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success("General settings saved successfully.");
    } catch {
      toast.error("Failed to save settings. Please try again.");
    }
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setLogoPreview(reader.result as string);
      toast.info("Preview only: logo upload will be connected separately.");
    };

    reader.readAsDataURL(file);
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center bg-[#F5F7FA]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#1F6F5C]/20 border-t-[#1F6F5C]" />
        <span className="ml-3 text-sm text-slate-600">Loading settings...</span>
      </div>
    );
  }

  if (settingsQuery.isError || !settings) {
    return (
      <div className="m-6 rounded-2xl border border-red-100 bg-white p-6">
        <h2 className="font-semibold text-slate-900">
          Unable to load settings
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Check that you are logged in and the backend is running.
        </p>
        <button
          type="button"
          onClick={() => settingsQuery.refetch()}
          className="mt-4 rounded-lg bg-[#1F6F5C] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F7FA] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Manage your store and general preferences.
          </p>
        </div>

        <div className="mb-4 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 border-b-[3px] border-[#1F6F5C] px-5 py-3 text-sm font-semibold text-[#1F6F5C]">
            <Store size={17} />
            General
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F6F5C]/10 text-[#1F6F5C]">
                <Store size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Store Profile
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update your store information and contact details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-2">
              <div>
                <span className={labelClass}>Store Logo</span>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-28 w-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {logoPreview || settings.logoUrl ? (
                      <img
                        src={logoPreview || settings.logoUrl || ""}
                        alt="Store logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F6F5C]/10 text-[#1F6F5C]">
                          <ImagePlus size={27} />
                        </div>
                        <p className="mt-2 text-sm font-bold text-[#1F6F5C]">
                          PawNest
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      aria-label="Upload store logo"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Upload size={17} />
                      Change logo
                    </button>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Recommended size: 512 × 512 px.
                      <br />
                      JPG, PNG or WebP (max 2 MB).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="storeName">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className={inputClass}
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  This name will be shown on your store and in emails.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="supportEmail">
                  Support Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="storePhone">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="storePhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="storeAddress">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="storeAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y leading-6`}
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  This address will be used for store information and customer
                  support.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="currency">
                  Currency
                </label>
                <div className="relative">
                  <input
                    id="currency"
                    value="INR (₹)"
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-slate-100 pr-10 text-slate-500`}
                  />
                  <LockKeyhole
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Currency cannot be changed.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F6F5C]/10 text-[#1F6F5C]">
                <Package size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Inventory</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage inventory-related settings.
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <label className={labelClass} htmlFor="lowStockThreshold">
                Low stock alert threshold{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="lowStockThreshold"
                type="number"
                min={1}
                step={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className={inputClass}
                required
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Products at or below this number appear in Low Stock Items on
                the dashboard.
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 pb-4 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={
                updateMutation.isPending || (!isDirty && !logoPreview)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={17} />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending || !isDirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E07A1F] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#C96812] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Save size={18} />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}