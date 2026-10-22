import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Mail,
  Package,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  UserRound,
  X,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminProfile,
  useRecentActivity,
  useUpdateAdminProfile,
  useUploadProfilePhoto,
} from "./profile.queries";

import type { AdminActivity, AdminProfile } from "./profile.api";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#49866E] focus:ring-4 focus:ring-[#49866E]/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const ACTIVITIES_PER_PAGE = 10;

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (end < total - 1) pages.push("...");

  pages.push(total);

  return pages;
}

/* -------------------------------------------------------------------------- */
/* Field labels                                                               */
/* -------------------------------------------------------------------------- */

const SETTING_LABELS: Record<string, string> = {
  storeName: "Store Name",
  supportEmail: "Support Email",
  phone: "Phone",
  address: "Address",
  lowStockThreshold: "Low Stock Threshold",
  logoUrl: "Logo",
  logo: "Logo",
  image: "Image",
};

const PROFILE_LABELS: Record<string, string> = {
  avatarUrl: "Profile Photo",
  name: "Name",
  phone: "Phone",
};

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

type FieldChange = { old?: unknown; new?: unknown };

function isFieldChange(value: unknown): value is FieldChange {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("old" in value || "new" in value)
  );
}

function valuesDiffer(a: unknown, b: unknown) {
  // null, undefined and "" are treated as the same "empty" value
  const normalize = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

  return normalize(a) !== normalize(b);
}

// Returns only the settings that actually changed (old !== new)
function getChangedSettings(
  metadata: Record<string, unknown>,
): [string, FieldChange][] {
  return Object.entries(metadata).filter(
    (entry): entry is [string, FieldChange] =>
      isFieldChange(entry[1]) && valuesDiffer(entry[1].old, entry[1].new),
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name?: string) {
  if (!name?.trim()) return "A";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function formatActivityDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getActivityPresentation(action: string, entity: string) {
  const value = `${action} ${entity}`.toLowerCase();

  if (value.includes("order")) {
    return {
      icon: ShoppingCart,
      className: "bg-orange-50 text-orange-600",
    };
  }

  if (value.includes("product")) {
    return {
      icon: Package,
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (value.includes("categor")) {
    return {
      icon: Tag,
      className: "bg-blue-50 text-blue-600",
    };
  }

  if (value.includes("setting") || value.includes("profile")) {
    return {
      icon: Settings,
      className: "bg-purple-50 text-purple-600",
    };
  }

  return {
    icon: FileText,
    className: "bg-slate-100 text-slate-600",
  };
}

function getActivityMetadata(activity: AdminActivity): Record<string, unknown> {
  if (
    activity.metadata &&
    typeof activity.metadata === "object" &&
    !Array.isArray(activity.metadata)
  ) {
    return activity.metadata as Record<string, unknown>;
  }

  return {};
}

function getMetadataText(
  metadata: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getActivityTitle(activity: AdminActivity) {
  const action = activity.action.toUpperCase();
  const entity = activity.entity.toUpperCase();

  if (entity === "PRODUCT") {
    if (action === "CREATE") return "Added new product";
    if (action === "UPDATE") return "Updated product";
    if (action === "DELETE") return "Deleted product";
  }

  if (entity === "CATEGORY") {
    if (action === "CREATE") return "Added new category";
    if (action === "UPDATE") return "Updated category";
    if (action === "DELETE") return "Deleted category";
  }

  if (entity === "ORDER") {
    if (action === "CREATE") return "Created order";
    if (action === "UPDATE") return "Changed order status";
    if (action === "DELETE") return "Deleted order";
    if (action === "CANCEL") return "Cancelled order";
  }

  if (entity === "USER") {
    if (action === "BLOCK") return "Blocked user";
    if (action === "UNBLOCK") return "Unblocked user";
    if (action === "UPDATE") return "Updated user";
    if (action === "DELETE") return "Deleted user";
    if (action === "CREATE") return "Added new user";
  }

  if (entity === "REVIEW") {
    if (action === "APPROVE") return "Approved review";
    if (action === "HIDE") return "Hidden review";
    if (action === "UPDATE") return "Updated review status";
    if (action === "DELETE") return "Deleted review";
    if (action === "CREATE") return "Submitted review";
  }

  if (entity === "STORE_SETTINGS") {
    if (action === "UPDATE") return "Updated store settings";
  }

  if (entity === "ADMIN_PROFILE") {
    if (action === "UPDATE") return "Updated profile";
  }

  const readableEntity = activity.entity.replace(/[_-]/g, " ").toLowerCase();

  const readableAction = activity.action.replace(/[_-]/g, " ").toLowerCase();

  return `${readableAction.charAt(0).toUpperCase()}${readableAction.slice(1)} ${readableEntity}`.trim();
}

function getActivityDescription(activity: AdminActivity) {
  const metadata = getActivityMetadata(activity);
  const entity = activity.entity.toUpperCase();
  const action = activity.action.toUpperCase();

  const name = getMetadataText(metadata, [
    "name",
    "productName",
    "categoryName",
    "customerName",
    "userName",
    "title",
  ]);

  const email = getMetadataText(metadata, ["email"]);

  const orderNumber = getMetadataText(metadata, [
    "orderNumber",
    "orderNo",
    "orderCode",
  ]);

  const status = getMetadataText(metadata, ["newStatus", "toStatus", "status"]);

  const description = getMetadataText(metadata, [
    "description",
    "message",
    "details",
  ]);

  if (entity === "PRODUCT") {
    if (name) {
      if (action === "CREATE") return `Added product ${name}`;
      if (action === "UPDATE") return `Updated product ${name}`;
      if (action === "DELETE") return `Deleted product ${name}`;
    }

    return activity.entityId
      ? `Product ID: ${activity.entityId}`
      : "Product details unavailable";
  }

  if (entity === "CATEGORY") {
    if (name) {
      if (action === "CREATE") return `Added category ${name}`;
      if (action === "UPDATE") return `Updated category ${name}`;
      if (action === "DELETE") return `Deleted category ${name}`;
    }

    return activity.entityId
      ? `Category ID: ${activity.entityId}`
      : "Category details unavailable";
  }

  if (entity === "USER") {
    const userLabel = name || email || activity.entityId || "user";

    if (action === "BLOCK") {
      return `Blocked user ${userLabel}`;
    }

    if (action === "UNBLOCK") {
      return `Unblocked user ${userLabel}`;
    }

    if (action === "UPDATE") {
      return `Updated user ${userLabel}`;
    }

    if (action === "DELETE") {
      return `Deleted user ${userLabel}`;
    }

    if (action === "CREATE") {
      return `Added new user ${userLabel}`;
    }

    if (email && name) {
      return `${name} · ${email}`;
    }

    return `User: ${userLabel}`;
  }

  if (entity === "ORDER") {
    const orderLabel = orderNumber || activity.entityId;

    if (orderLabel && status) {
      return `Changed order #${orderLabel} status to ${status}`;
    }

    if (orderLabel) {
      if (action === "CREATE") return `Created order #${orderLabel}`;
      if (action === "DELETE") return `Deleted order #${orderLabel}`;
      if (action === "CANCEL") return `Cancelled order #${orderLabel}`;

      return `Updated order #${orderLabel}`;
    }
  }

  if (entity === "STORE_SETTINGS") {
    // New logs: { field: { old, new } } -> show only fields that really changed
    const changed = getChangedSettings(metadata);

    if (changed.length > 0) {
      return `Updated setting information: ${changed
        .map(([key]) => SETTING_LABELS[key] ?? humanizeKey(key))
        .join(", ")}`;
    }

    // Old logs (without old/new) -> fall back to known setting keys
    const legacyFields = Object.keys(metadata).filter(
      (key) => key in SETTING_LABELS,
    );

    if (legacyFields.length > 0) {
      return `Updated setting information: ${legacyFields
        .map((key) => SETTING_LABELS[key])
        .join(", ")}`;
    }

    return "Updated setting information";
  }

  if (entity === "ADMIN_PROFILE") {
    const updatedFields = metadata.updatedFields;

    if (Array.isArray(updatedFields)) {
      const fields = updatedFields
        .filter((field): field is string => typeof field === "string")
        .map((field) => PROFILE_LABELS[field] ?? humanizeKey(field));

      if (fields.length > 0) {
        return `Updated profile information: ${fields.join(", ")}`;
      }
    }

    return "Updated admin profile information";
  }

  if (description) return description;

  if (name) {
    return `${activity.entity.replace(/_/g, " ")}: ${name}`;
  }

  if (activity.entityId) {
    return `${activity.entity.replace(/_/g, " ")} · ID ${activity.entityId}`;
  }

  return "Admin panel activity";
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function ProfileAvatar({
  profile,
  size = "large",
}: {
  profile: AdminProfile;
  size?: "large" | "small";
}) {
  const sizeClass =
    size === "large" ? "h-32 w-32 text-4xl" : "h-10 w-10 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#006047] font-semibold text-white ${sizeClass}`}
    >
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={`${profile.name}'s profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(profile.name)
      )}
    </div>
  );
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = useAdminProfile();
  const activityQuery = useRecentActivity();
  const updateMutation = useUpdateAdminProfile();
  const photoMutation = useUploadProfilePhoto();

  const profile = profileQuery.data;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [showAllActivity, setShowAllActivity] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const hasChanges =
    !!profile &&
    (name !== (profile.name ?? "") || phone !== (profile.phone ?? ""));

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (phone.trim().length > 20) {
      toast.error("Phone number is too long.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || null,
      });

      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Could not update your profile. Please try again.");
    }
  }

  function handleCancel() {
    if (!profile) return;

    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be 5 MB or less.");
      return;
    }

    try {
      await photoMutation.mutateAsync(file);
      toast.success("Profile photo updated successfully.");
    } catch {
      toast.error("Could not upload your photo. Please try again.");
    }
  }

  if (profileQuery.isPending) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <LoaderCircle size={32} className="animate-spin text-[#295F4C]" />
          <p className="text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertCircle size={36} className="text-red-500" />

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Unable to load profile
        </h2>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          We couldn't fetch your admin profile. Check your connection and try
          again.
        </p>

        <button
          type="button"
          onClick={() => profileQuery.refetch()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214D3E]"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  const activities = activityQuery.data ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil(activities.length / ACTIVITIES_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * ACTIVITIES_PER_PAGE;

  const visibleActivities = showAllActivity
    ? activities.slice(pageStart, pageStart + ACTIVITIES_PER_PAGE)
    : activities.slice(0, 4);

  const isSaving = updateMutation.isPending;
  const isUploading = photoMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Manage your personal information.
        </p>
      </div>

      {/* Profile overview and personal information */}
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)]">
        {/* Profile card */}
        <section className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-5 py-7 shadow-sm sm:px-7">
          <div className="relative mt-1">
            <ProfileAvatar profile={profile} />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {isUploading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Camera size={17} />
            )}
            {isUploading ? "Uploading..." : "Change photo"}
          </button>

          <h2 className="mt-4 max-w-full break-words text-xl font-bold text-slate-900">
            {profile.name || "Admin"}
          </h2>

          <span className="mt-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Administrator
          </span>

          <div className="mt-5 flex w-full flex-col items-center gap-3 text-sm text-slate-600">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
              <Mail size={18} className="shrink-0 text-slate-500" />

              <span className="break-all">{profile.email}</span>

              {profile.emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <CalendarDays size={18} className="shrink-0 text-slate-500" />
              <span>Member since {formatDate(profile.createdAt)}</span>
            </div>
          </div>

          <div className="mt-6 w-full border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-[#49866E]" />
              Your account information is managed securely.
            </div>
          </div>
        </section>

        {/* Personal information form */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <UserRound
              size={26}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-[#28785E]"
            />

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Update your personal details below.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
              {/* Name */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="text-sm font-semibold text-slate-800"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="profile-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSaving}
                  className={inputClass}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="text-sm font-semibold text-slate-800"
                >
                  Email <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    className={`${inputClass} pr-28`}
                  />

                  <span className="absolute inset-y-0 right-3 mt-2 flex items-center gap-1 text-xs font-semibold text-slate-400">
                    {profile.emailVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700">
                        <CheckCircle2 size={14} />
                        Verified
                      </span>
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Email cannot be changed here.
                </p>
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <label
                  htmlFor="profile-phone"
                  className="text-sm font-semibold text-slate-800"
                >
                  Phone
                </label>

                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={isSaving}
                  className={inputClass}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:border-t-0 sm:pt-0">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#E87508] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D56806] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[205px]"
              >
                {isSaving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Save size={19} />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-start gap-3">
            <Clock3
              size={27}
              strokeWidth={1.9}
              className="mt-0.5 shrink-0 text-[#28785E]"
            />

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Your latest actions in the admin panel.
              </p>
            </div>
          </div>

          {!activityQuery.isPending &&
            !activityQuery.isError &&
            activities.length > 4 && (
              <button
                type="button"
                onClick={() => {
                  setShowAllActivity((value) => !value);
                  setCurrentPage(1);
                }}
                className="self-start text-sm font-semibold text-[#28785E] underline underline-offset-4 hover:text-[#18583F] sm:self-auto"
              >
                {showAllActivity ? "Show less" : "View all"}
              </button>
            )}
        </div>

        <div className="px-5 sm:px-7">
          {activityQuery.isPending ? (
            <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin text-[#49866E]" />
              Loading recent activity...
            </div>
          ) : activityQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={26} className="text-amber-500" />

              <p className="mt-2 text-sm font-semibold text-slate-700">
                Unable to load recent activity
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Check whether the activity API is configured.
              </p>

              <button
                type="button"
                onClick={() => activityQuery.refetch()}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#28785E] hover:underline"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#49866E]/10 text-[#28785E]">
                <Clock3 size={23} />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No activity yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your admin actions will appear here when audit logging is
                configured.
              </p>
            </div>
          ) : (
            <div>
              {visibleActivities.map((activity) => {
                const presentation = getActivityPresentation(
                  activity.action,
                  activity.entity,
                );

                const ActivityIcon =
                  activity.entity.toUpperCase() === "USER"
                    ? UserRound
                    : presentation.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${presentation.className}`}
                      >
                        <ActivityIcon size={23} strokeWidth={1.9} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {getActivityTitle(activity)}
                        </p>

                        <p className="mt-1 break-words text-sm text-slate-500">
                          {getActivityDescription(activity)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-[60px] text-xs text-slate-500 sm:pl-0 sm:text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatActivityDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activityQuery.isSuccess &&
          activities.length > 4 &&
          showAllActivity && (
            <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-between sm:px-7">
              <p className="text-xs text-slate-500">
                Showing {pageStart + 1}–{pageStart + visibleActivities.length}{" "}
                of {activities.length} activities
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {getPageNumbers(safePage, totalPages).map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-sm text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Page ${page}`}
                        aria-current={page === safePage ? "page" : undefined}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                          page === safePage
                            ? "bg-[#28785E] text-white"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
      </section>
    </div>
  );
}
